import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { TicketStatus } from '../domain/enums';
import { AuthUser, Ticket } from '../domain/types';
import { TicketRepository } from '../data/ticket-repository';
import { HttpError } from '../utils/http-error';

export interface AsyncQueueMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
}

export interface AsyncMessageQueue {
  isConfigured(): boolean;
  enqueue(body: string): Promise<string>;
  receiveMessages(batchSize: number, waitTimeSeconds: number): Promise<AsyncQueueMessage[]>;
  deleteMessage(receiptHandle: string): Promise<void>;
}

export interface ProcessedAsyncMessage {
  messageId: string;
  payload: unknown;
  processedAt: string;
  enqueuedAt?: string;
  requestedBy?: {
    id: string;
    email: string;
    role: string;
    teamId?: string;
  };
  rawBody?: string;
}

export interface AsyncResultWriter {
  writeDocument(key: string, document: unknown): Promise<void>;
}

export interface AsyncActorInfo {
  id: string;
  email: string;
  role: string;
  teamId?: string;
}

export interface TicketSnapshotPayload {
  type: 'ticket-snapshot';
  ticketId: string;
  trigger: 'status-change' | 'sla-escalation';
  status?: TicketStatus;
  reason?: string;
}

interface AsyncEnvelope {
  payload: unknown;
  enqueuedAt: string;
  requestedBy: AsyncActorInfo;
}

export class SqsAsyncMessageQueue implements AsyncMessageQueue {
  private readonly client = new SQSClient({ region: env.AWS_REGION });

  constructor(private readonly queueUrl = env.ASYNC_QUEUE_URL) {}

  isConfigured(): boolean {
    return Boolean(this.queueUrl);
  }

  async enqueue(body: string): Promise<string> {
    const response = await this.client.send(new SendMessageCommand({
      QueueUrl: this.requireQueueUrl(),
      MessageBody: body
    }));

    if (!response.MessageId) {
      throw new Error('SQS did not return a message ID');
    }

    return response.MessageId;
  }

  async receiveMessages(batchSize: number, waitTimeSeconds: number): Promise<AsyncQueueMessage[]> {
    if (!this.queueUrl) {
      return [];
    }

    const response = await this.client.send(new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: Math.min(Math.max(batchSize, 1), 10),
      WaitTimeSeconds: Math.min(Math.max(waitTimeSeconds, 0), 20)
    }));

    return (response.Messages ?? []).flatMap((message: { MessageId?: string; ReceiptHandle?: string; Body?: string }) => {
      if (!message.MessageId || !message.ReceiptHandle || message.Body === undefined) {
        return [];
      }

      return [{
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle,
        body: message.Body
      }];
    });
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    await this.client.send(new DeleteMessageCommand({
      QueueUrl: this.requireQueueUrl(),
      ReceiptHandle: receiptHandle
    }));
  }

  private requireQueueUrl(): string {
    if (!this.queueUrl) {
      throw new HttpError(503, 'Async queue is not configured');
    }

    return this.queueUrl;
  }
}

export class S3AsyncResultWriter implements AsyncResultWriter {
  private readonly client = new S3Client({ region: env.AWS_REGION });

  constructor(private readonly bucketName = env.ASYNC_BUCKET_NAME) {}

  async writeDocument(key: string, document: unknown): Promise<void> {
    if (!this.bucketName) {
      throw new HttpError(503, 'Async result bucket is not configured');
    }

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(document, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256'
    }));
  }
}

export class AsyncMessageService {
  constructor(private readonly queue: AsyncMessageQueue) {}

  async enqueue(payload: unknown, actor: AuthUser): Promise<{ messageId: string }> {
    const messageId = await this.enqueueEnvelope(payload, actorToAsyncActor(actor));

    return { messageId };
  }

  async enqueueTicketSnapshot(payload: TicketSnapshotPayload, actor: AsyncActorInfo): Promise<{ messageId: string } | null> {
    if (!this.queue.isConfigured()) {
      logger.info({ ticketId: payload.ticketId, trigger: payload.trigger }, 'Async queue not configured; snapshot archival skipped');
      return null;
    }

    const messageId = await this.enqueueEnvelope(payload, actor);
    return { messageId };
  }

  private async enqueueEnvelope(payload: unknown, actor: AsyncActorInfo): Promise<string> {
    return this.queue.enqueue(JSON.stringify({
      payload,
      enqueuedAt: new Date().toISOString(),
      requestedBy: actor
    } satisfies AsyncEnvelope));
  }
}

interface AsyncConsumerOptions {
  enabled?: boolean;
  batchSize?: number;
  waitTimeSeconds?: number;
  pollIntervalMs?: number;
}

export class AsyncConsumer {
  private running = false;
  private readonly enabled: boolean;
  private readonly batchSize: number;
  private readonly waitTimeSeconds: number;
  private readonly pollIntervalMs: number;

  constructor(
    private readonly queue: AsyncMessageQueue,
    private readonly writer: AsyncResultWriter,
    private readonly tickets: TicketRepository,
    options: AsyncConsumerOptions = {}
  ) {
    this.enabled = options.enabled ?? env.ASYNC_POLLING_ENABLED;
    this.batchSize = options.batchSize ?? env.ASYNC_POLL_BATCH_SIZE;
    this.waitTimeSeconds = options.waitTimeSeconds ?? env.ASYNC_POLL_WAIT_TIME_SECONDS;
    this.pollIntervalMs = options.pollIntervalMs ?? env.ASYNC_POLL_INTERVAL_MS;
  }

  start(): void {
    if (!this.enabled) {
      logger.info('Async consumer disabled by configuration');
      return;
    }

    if (!this.queue.isConfigured()) {
      logger.warn('Async consumer not started because queue is not configured');
      return;
    }

    if (this.running) {
      return;
    }

    this.running = true;
    logger.info({ batchSize: this.batchSize, waitTimeSeconds: this.waitTimeSeconds }, 'Async consumer started');
    void this.pollLoop();
  }

  stop(): void {
    this.running = false;
  }

  async processAvailableMessages(): Promise<number> {
    const messages = await this.queue.receiveMessages(this.batchSize, this.waitTimeSeconds);

    for (const message of messages) {
      await this.processMessage(message);
    }

    return messages.length;
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      try {
        const processed = await this.processAvailableMessages();
        if (processed === 0) {
          await delay(this.pollIntervalMs);
        }
      } catch (error) {
        logger.error({ error }, 'Async consumer iteration failed');
        await delay(this.pollIntervalMs);
      }
    }
  }

  private async processMessage(message: AsyncQueueMessage): Promise<void> {
    const parsed = parseMessageBody(message.body);
    const processedAt = new Date().toISOString();
    const document = isTicketSnapshotPayload(parsed.payload)
      ? await this.buildTicketSnapshotDocument(message.messageId, parsed.payload, parsed, processedAt)
      : {
          messageId: message.messageId,
          payload: parsed.payload,
          processedAt,
          enqueuedAt: parsed.enqueuedAt,
          requestedBy: parsed.requestedBy,
          rawBody: parsed.rawBody
        } satisfies ProcessedAsyncMessage;
    const objectKey = isTicketSnapshotPayload(parsed.payload)
      ? `async/tickets/${parsed.payload.ticketId}/${message.messageId}.json`
      : `async/${message.messageId}.json`;

    await this.writer.writeDocument(objectKey, document);
    await this.queue.deleteMessage(message.receiptHandle);

    logger.info({ messageId: message.messageId, objectKey }, 'Async message processed');
  }

  private async buildTicketSnapshotDocument(
    messageId: string,
    payload: TicketSnapshotPayload,
    parsed: {
      enqueuedAt?: string;
      requestedBy?: ProcessedAsyncMessage['requestedBy'];
      rawBody?: string;
    },
    processedAt: string
  ): Promise<ProcessedAsyncMessage & {
    type: 'ticket-snapshot';
    trigger: TicketSnapshotPayload['trigger'];
    ticketId: string;
    snapshotReason?: string;
    ticket: Ticket;
  }> {
    const ticket = await this.tickets.getById(payload.ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${payload.ticketId} not found for async snapshot`);
    }

    return {
      type: 'ticket-snapshot',
      trigger: payload.trigger,
      ticketId: payload.ticketId,
      snapshotReason: payload.reason,
      messageId,
      payload,
      processedAt,
      enqueuedAt: parsed.enqueuedAt,
      requestedBy: parsed.requestedBy,
      rawBody: parsed.rawBody,
      ticket
    };
  }
}

function parseMessageBody(body: string): {
  payload: unknown;
  enqueuedAt?: string;
  requestedBy?: ProcessedAsyncMessage['requestedBy'];
  rawBody?: string;
} {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;

    return {
      payload: Object.prototype.hasOwnProperty.call(parsed, 'payload') ? parsed.payload : parsed,
      enqueuedAt: typeof parsed.enqueuedAt === 'string' ? parsed.enqueuedAt : undefined,
      requestedBy: isRequestedBy(parsed.requestedBy) ? parsed.requestedBy : undefined
    };
  } catch {
    return {
      payload: { rawBody: body },
      rawBody: body
    };
  }
}

function isRequestedBy(value: unknown): value is ProcessedAsyncMessage['requestedBy'] {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.role === 'string'
    && (candidate.teamId === undefined || typeof candidate.teamId === 'string');
}

function isTicketSnapshotPayload(value: unknown): value is TicketSnapshotPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.type === 'ticket-snapshot'
    && typeof candidate.ticketId === 'string'
    && (candidate.trigger === 'status-change' || candidate.trigger === 'sla-escalation')
    && (candidate.reason === undefined || typeof candidate.reason === 'string');
}

function actorToAsyncActor(actor: AuthUser): AsyncActorInfo {
  return {
    id: actor.id,
    email: actor.email,
    role: actor.role,
    teamId: actor.teamId
  };
}

export function systemAsyncActor(): AsyncActorInfo {
  return {
    id: 'SYSTEM',
    email: 'system@ticketflow.local',
    role: 'SYSTEM'
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
