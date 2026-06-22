import { describe, expect, it } from 'vitest';
import { LocalAttachmentStorage } from '../src/data/local-attachment-storage';
import { MemoryTicketRepository } from '../src/data/memory-ticket-repository';
import { AuthUser, Ticket } from '../src/domain/types';
import {
  AsyncConsumer,
  AsyncMessageQueue,
  AsyncMessageService,
  AsyncQueueMessage,
  AsyncResultWriter,
  ProcessedAsyncMessage
} from '../src/services/async-message-service';
import { NotificationService } from '../src/services/notification-service';
import { TicketService } from '../src/services/ticket-service';
import { UserService } from '../src/services/user-service';

class InMemoryAsyncQueue implements AsyncMessageQueue {
  private sequence = 0;
  private readonly messages: AsyncQueueMessage[] = [];

  isConfigured(): boolean {
    return true;
  }

  async enqueue(body: string): Promise<string> {
    this.sequence += 1;
    const messageId = `msg-${this.sequence}`;
    this.messages.push({
      messageId,
      receiptHandle: `receipt-${this.sequence}`,
      body
    });
    return messageId;
  }

  async receiveMessages(batchSize: number): Promise<AsyncQueueMessage[]> {
    return this.messages.slice(0, batchSize);
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    const index = this.messages.findIndex((message) => message.receiptHandle === receiptHandle);
    if (index >= 0) {
      this.messages.splice(index, 1);
    }
  }
}

class InMemoryAsyncResultWriter implements AsyncResultWriter {
  readonly writes: Array<{ key: string; document: unknown }> = [];

  async writeDocument(key: string, document: unknown): Promise<void> {
    this.writes.push({ key, document });
  }
}

function buildActors(): { requester: AuthUser; agent: AuthUser } {
  const users = new UserService();
  const requester = users.findByEmail('ana@ticketflow.local');
  const agent = users.findByEmail('luis@ticketflow.local');

  if (!requester || !agent) {
    throw new Error('Default users are not available');
  }

  return {
    requester: users.toAuthUser(requester),
    agent: users.toAuthUser(agent)
  };
}

function buildRoleActors(): { requester: AuthUser; agent: AuthUser; anotherAgent: AuthUser; supervisor: AuthUser; admin: AuthUser } {
  const users = new UserService();
  const requester = users.findByEmail('ana@ticketflow.local');
  const agent = users.findByEmail('luis@ticketflow.local');
  const anotherAgent = users.findByEmail('maria@ticketflow.local');
  const supervisor = users.findByEmail('sofia@ticketflow.local');
  const admin = users.findByEmail('admin@ticketflow.local');

  if (!requester || !agent || !anotherAgent || !supervisor || !admin) {
    throw new Error('Default users are not available');
  }

  return {
    requester: users.toAuthUser(requester),
    agent: users.toAuthUser(agent),
    anotherAgent: users.toAuthUser(anotherAgent),
    supervisor: users.toAuthUser(supervisor),
    admin: users.toAuthUser(admin)
  };
}

describe('TicketFlow services', () => {
  it('creates, lists and updates a ticket with role-based visibility', async () => {
    const users = new UserService();
    const notifications = new NotificationService();
    const repository = new MemoryTicketRepository();
    const storage = new LocalAttachmentStorage('/private/tmp/ticketflow-test-attachments');
    const asyncQueue = new InMemoryAsyncQueue();
    const asyncMessages = new AsyncMessageService(asyncQueue);
    const tickets = new TicketService(repository, storage, users, notifications, asyncMessages);
    const { requester, agent } = buildActors();

    const created = await tickets.createTicket({
      title: 'Error 500 al procesar pago',
      description: 'El sistema muestra error 500 cuando intento pagar.',
      category: 'pagos'
    }, requester);

    expect(created.id).toMatch(/^TKT-/);
    expect(created.priority).toBe('P1');

    await tickets.addComment(created.id, {
      content: 'Revisando logs internos.',
      visibility: 'INTERNAL'
    }, agent);

    const requesterView = await tickets.getTicket(created.id, requester);
    expect(requesterView.comments).toHaveLength(0);

    const updated = await tickets.updateStatus(created.id, {
      status: 'CLOSED',
      reason: 'Caso resuelto y cerrado'
    }, agent);

    expect(updated.status).toBe('CLOSED');

    const archivedCount = await new AsyncConsumer(asyncQueue, new InMemoryAsyncResultWriter(), repository, {
      enabled: false,
      batchSize: 5,
      waitTimeSeconds: 0,
      pollIntervalMs: 250
    }).processAvailableMessages();
    expect(archivedCount).toBe(1);
  });

  it('enqueues async messages and processes them into object storage', async () => {
    const queue = new InMemoryAsyncQueue();
    const writer = new InMemoryAsyncResultWriter();
    const asyncMessages = new AsyncMessageService(queue);
    const repository = new MemoryTicketRepository();
    const asyncConsumer = new AsyncConsumer(queue, writer, repository, {
      enabled: false,
      batchSize: 5,
      waitTimeSeconds: 0,
      pollIntervalMs: 250
    });
    const { requester } = buildActors();

    const enqueued = await asyncMessages.enqueue({
      type: 'sla-report',
      requestedAt: '2026-06-20T12:00:00.000Z'
    }, requester);

    expect(enqueued.messageId).toBe('msg-1');

    const processedCount = await asyncConsumer.processAvailableMessages();
    expect(processedCount).toBe(1);
    expect(writer.writes).toHaveLength(1);
    expect(writer.writes[0]).toMatchObject({
      key: 'async/msg-1.json',
      document: {
        messageId: 'msg-1',
        payload: {
          type: 'sla-report',
          requestedAt: '2026-06-20T12:00:00.000Z'
        },
        requestedBy: {
          email: 'ana@ticketflow.local'
        }
      }
    });
  });

  it('archives a real ticket snapshot when a ticket is closed', async () => {
    const users = new UserService();
    const notifications = new NotificationService();
    const repository = new MemoryTicketRepository();
    const storage = new LocalAttachmentStorage('/private/tmp/ticketflow-test-attachments');
    const queue = new InMemoryAsyncQueue();
    const writer = new InMemoryAsyncResultWriter();
    const asyncMessages = new AsyncMessageService(queue);
    const tickets = new TicketService(repository, storage, users, notifications, asyncMessages);
    const asyncConsumer = new AsyncConsumer(queue, writer, repository, {
      enabled: false,
      batchSize: 5,
      waitTimeSeconds: 0,
      pollIntervalMs: 250
    });
    const { requester, agent } = buildActors();

    const created = await tickets.createTicket({
      title: 'Servidor sin responder',
      description: 'El portal deja de responder en horario habil.',
      category: 'infraestructura'
    }, requester);

    await tickets.updateStatus(created.id, {
      status: 'RESOLVED',
      reason: 'Incidente mitigado'
    }, agent);

    const processed = await asyncConsumer.processAvailableMessages();
    expect(processed).toBe(1);
    expect(writer.writes[0]).toMatchObject({
      key: `async/tickets/${created.id}/msg-1.json`
    });

    const document = writer.writes[0].document as ProcessedAsyncMessage & {
      type: 'ticket-snapshot';
      ticketId: string;
      ticket: Ticket;
    };

    expect(document.type).toBe('ticket-snapshot');
    expect(document.ticketId).toBe(created.id);
    expect(document.ticket.status).toBe('RESOLVED');
    expect(document.ticket.id).toBe(created.id);
  });

  it('archives a real ticket snapshot when an SLA breach escalates the ticket', async () => {
    const users = new UserService();
    const notifications = new NotificationService();
    const repository = new MemoryTicketRepository();
    const storage = new LocalAttachmentStorage('/private/tmp/ticketflow-test-attachments');
    const queue = new InMemoryAsyncQueue();
    const writer = new InMemoryAsyncResultWriter();
    const asyncMessages = new AsyncMessageService(queue);
    const tickets = new TicketService(repository, storage, users, notifications, asyncMessages);
    const asyncConsumer = new AsyncConsumer(queue, writer, repository, {
      enabled: false,
      batchSize: 5,
      waitTimeSeconds: 0,
      pollIntervalMs: 250
    });
    const { requester } = buildActors();

    const created = await tickets.createTicket({
      title: 'API intermitente',
      description: 'La API deja de responder por varios minutos.',
      category: 'infraestructura',
      priority: 'P0'
    }, requester);

    const stale = await repository.getById(created.id);
    if (!stale) {
      throw new Error('Ticket not found in memory repository');
    }

    stale.sla.responseDueAt = '2026-01-01T00:00:00.000Z';
    stale.sla.resolutionDueAt = '2026-01-01T00:00:00.000Z';
    await repository.update(stale);

    const result = await tickets.evaluateAndEscalateOverdueTickets();
    expect(result.escalated).toBe(1);

    const processed = await asyncConsumer.processAvailableMessages();
    expect(processed).toBe(1);
    expect(writer.writes[0]).toMatchObject({
      key: `async/tickets/${created.id}/msg-1.json`
    });

    const document = writer.writes[0].document as ProcessedAsyncMessage & {
      type: 'ticket-snapshot';
      trigger: 'sla-escalation';
      ticket: Ticket;
    };

    expect(document.type).toBe('ticket-snapshot');
    expect(document.trigger).toBe('sla-escalation');
    expect(document.ticket.escalated).toBe(true);
  });

  it('limits agent visibility to assigned tickets while supervisors and admins see the full queue', async () => {
    const users = new UserService();
    const notifications = new NotificationService();
    const repository = new MemoryTicketRepository();
    const storage = new LocalAttachmentStorage('/private/tmp/ticketflow-test-attachments');
    const tickets = new TicketService(repository, storage, users, notifications);
    const { requester, agent, anotherAgent, supervisor, admin } = buildRoleActors();

    const assignedToAgent = await tickets.createTicket({
      title: 'VPN no conecta',
      description: 'El usuario no puede conectarse a la VPN corporativa.',
      category: 'red',
      assignedAgentId: agent.id
    }, requester);

    const assignedToAnotherAgent = await tickets.createTicket({
      title: 'Correo no sincroniza',
      description: 'El correo del usuario no sincroniza en el movil.',
      category: 'correo',
      assignedAgentId: anotherAgent.id
    }, requester);

    const agentTickets = await tickets.listTickets({ includeClosed: true }, agent);
    const anotherAgentTickets = await tickets.listTickets({ includeClosed: true }, anotherAgent);
    const supervisorTickets = await tickets.listTickets({ includeClosed: true }, supervisor);
    const adminTickets = await tickets.listTickets({ includeClosed: true }, admin);

    expect(agentTickets.map((ticket) => ticket.id)).toEqual([assignedToAgent.id]);
    expect(anotherAgentTickets.map((ticket) => ticket.id)).toEqual([assignedToAnotherAgent.id]);
    expect(supervisorTickets.map((ticket) => ticket.id).sort()).toEqual([assignedToAgent.id, assignedToAnotherAgent.id].sort());
    expect(adminTickets.map((ticket) => ticket.id).sort()).toEqual([assignedToAgent.id, assignedToAnotherAgent.id].sort());
  });
});
