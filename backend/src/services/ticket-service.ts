import { randomUUID } from 'crypto';
import { AttachmentStorage } from '../data/attachment-storage';
import { TicketRepository } from '../data/ticket-repository';
import { ticketPriorities, ticketStatuses, TicketPriority, TicketStatus } from '../domain/enums';
import { suggestPriority } from '../domain/priority';
import { calculateSla, evaluateSla } from '../domain/sla';
import { Attachment, AuthUser, AuditEvent, Comment, Ticket, TicketFilters } from '../domain/types';
import { assertFound, HttpError } from '../utils/http-error';
import { NotificationService } from './notification-service';
import { UserService } from './user-service';

export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  category: string;
  priority?: TicketPriority;
  assignedAgentId?: string;
  teamId?: string;
  attachments?: UploadedFileInput[];
}

export interface UpdateTicketStatusInput {
  status: TicketStatus;
  reason?: string;
}

export interface AddCommentInput {
  content: string;
  visibility: 'PUBLIC' | 'INTERNAL';
}

export class TicketService {
  constructor(
    private readonly repository: TicketRepository,
    private readonly storage: AttachmentStorage,
    private readonly users: UserService,
    private readonly notifications: NotificationService
  ) {}

  async createTicket(input: CreateTicketInput, actor: AuthUser): Promise<Ticket> {
    const now = new Date();
    const suggestedPriority = suggestPriority({ title: input.title, category: input.category });
    const priority = input.priority ?? suggestedPriority;
    const teamId = input.teamId ?? actor.teamId ?? 'support-core';
    const assignedAgentId = input.assignedAgentId ?? await this.findLeastLoadedAgent(teamId);
    const ticket: Ticket = {
      id: `TKT-${now.getFullYear()}-${randomUUID().slice(0, 8)}`,
      title: input.title,
      description: input.description,
      category: input.category,
      priority,
      suggestedPriority,
      status: assignedAgentId ? 'ASSIGNED' : 'OPEN',
      requesterId: actor.id,
      assignedAgentId,
      teamId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      escalated: false,
      sla: calculateSla(priority, now),
      attachments: [],
      comments: [],
      auditLog: [this.audit('TICKET_CREATED', actor.id, undefined, undefined, { priority, assignedAgentId })],
      ttlEpochSeconds: Math.floor(now.getTime() / 1000) + 365 * 24 * 60 * 60
    };

    for (const file of input.attachments ?? []) {
      ticket.attachments.push(await this.storeAttachment(ticket.id, file, actor.id));
    }

    const saved = await this.repository.create(ticket);
    await this.notifications.ticketCreated(saved, actor.email);
    return this.present(saved, actor);
  }

  async listTickets(filters: TicketFilters, actor: AuthUser): Promise<Ticket[]> {
    const constrained = this.constrainFilters(filters, actor);
    const tickets = await this.repository.list(constrained);
    const refreshed = await Promise.all(tickets.map((ticket) => this.refreshSlaState(ticket)));
    return refreshed.map((ticket) => this.present(ticket, actor));
  }

  async getTicket(id: string, actor: AuthUser): Promise<Ticket> {
    const ticket = await this.loadAuthorized(id, actor);
    const refreshed = await this.refreshSlaState(ticket);
    return this.present(refreshed, actor);
  }

  async updateStatus(id: string, input: UpdateTicketStatusInput, actor: AuthUser): Promise<Ticket> {
    if (!ticketStatuses.includes(input.status)) {
      throw new HttpError(400, 'Invalid ticket status');
    }
    const ticket = await this.loadAuthorized(id, actor);
    this.ensureSupportAccess(ticket, actor);

    const previous = ticket.status;
    if (previous === input.status) {
      return this.present(ticket, actor);
    }

    const now = new Date().toISOString();
    ticket.status = input.status;
    ticket.updatedAt = now;
    if (!ticket.sla.firstResponseAt && ['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(input.status)) {
      ticket.sla.firstResponseAt = now;
    }
    if (['RESOLVED', 'CLOSED'].includes(input.status)) {
      ticket.closedAt = now;
      ticket.sla.resolvedAt = now;
    }
    ticket.auditLog.push(this.audit('STATUS_CHANGED', actor.id, input.reason, previous, input.status));

    const saved = await this.repository.update(ticket);
    const requester = this.users.findById(saved.requesterId);
    if (requester) {
      await this.notifications.statusChanged(saved, requester.email);
    }
    return this.present(saved, actor);
  }

  async assignTicket(id: string, assignedAgentId: string, actor: AuthUser, reason?: string): Promise<Ticket> {
    const ticket = await this.loadAuthorized(id, actor);
    this.ensureSupportAccess(ticket, actor);
    const agent = this.users.findById(assignedAgentId);
    if (!agent || agent.role !== 'AGENT') {
      throw new HttpError(400, 'Assigned user must be an agent');
    }

    const previous = ticket.assignedAgentId;
    ticket.assignedAgentId = assignedAgentId;
    ticket.teamId = agent.teamId ?? ticket.teamId;
    ticket.status = ticket.status === 'OPEN' ? 'ASSIGNED' : ticket.status;
    ticket.updatedAt = new Date().toISOString();
    ticket.auditLog.push(this.audit(previous ? 'REASSIGNED' : 'ASSIGNED', actor.id, reason, previous, assignedAgentId));
    return this.present(await this.repository.update(ticket), actor);
  }

  async addComment(id: string, input: AddCommentInput, actor: AuthUser): Promise<Ticket> {
    const ticket = await this.loadAuthorized(id, actor);
    if (input.visibility === 'INTERNAL') {
      this.ensureSupportAccess(ticket, actor);
    }

    const now = new Date().toISOString();
    const comment: Comment = {
      id: `COM-${randomUUID().slice(0, 8)}`,
      authorId: actor.id,
      authorRole: actor.role,
      content: input.content,
      visibility: input.visibility,
      createdAt: now
    };

    ticket.comments.push(comment);
    ticket.updatedAt = now;
    if (!ticket.sla.firstResponseAt && actor.role !== 'REQUESTER') {
      ticket.sla.firstResponseAt = now;
    }
    ticket.auditLog.push(this.audit('COMMENT_ADDED', actor.id, input.visibility, undefined, { commentId: comment.id }));
    return this.present(await this.repository.update(ticket), actor);
  }

  async addAttachments(id: string, files: UploadedFileInput[], actor: AuthUser): Promise<Ticket> {
    const ticket = await this.loadAuthorized(id, actor);
    for (const file of files) {
      const attachment = await this.storeAttachment(ticket.id, file, actor.id);
      ticket.attachments.push(attachment);
      ticket.auditLog.push(this.audit('ATTACHMENT_ADDED', actor.id, undefined, undefined, { attachmentId: attachment.id }));
    }
    ticket.updatedAt = new Date().toISOString();
    return this.present(await this.repository.update(ticket), actor);
  }

  async getAttachmentUrl(ticketId: string, attachmentId: string, actor: AuthUser): Promise<{ url: string }> {
    const ticket = await this.loadAuthorized(ticketId, actor);
    const attachment = assertFound(ticket.attachments.find((item) => item.id === attachmentId), 'Attachment not found');
    return { url: await this.storage.getDownloadUrl(attachment.storageKey) };
  }

  async downloadAttachment(ticketId: string, attachmentId: string, actor: AuthUser): Promise<{ attachment: Attachment; buffer: Buffer; mimeType: string }> {
    const ticket = await this.loadAuthorized(ticketId, actor);
    const attachment = assertFound(ticket.attachments.find((item) => item.id === attachmentId), 'Attachment not found');
    const object = await this.storage.getObject(attachment.storageKey);
    return { attachment, buffer: object.buffer, mimeType: object.mimeType ?? attachment.mimeType };
  }

  async evaluateAndEscalateOverdueTickets(): Promise<{ evaluated: number; escalated: number }> {
    const active = await this.repository.list({ includeClosed: false });
    let escalated = 0;

    for (const ticket of active) {
      const evaluated = evaluateSla(ticket.sla, ticket.createdAt);
      const needsEscalation = evaluated.isBreached && !ticket.escalated;
      ticket.sla = evaluated;

      if (needsEscalation) {
        ticket.escalated = true;
        ticket.sla.escalatedAt = new Date().toISOString();
        const previousAgent = ticket.assignedAgentId;
        const reassignedAgent = await this.findLeastLoadedAgent(ticket.teamId);
        if (reassignedAgent) {
          ticket.assignedAgentId = reassignedAgent;
        }
        ticket.auditLog.push(this.audit('SLA_ESCALATED', 'SYSTEM', 'Resolution SLA breached', previousAgent, ticket.assignedAgentId));
        escalated += 1;
        const supervisors = this.users.listSupervisors(ticket.teamId).map((user) => user.email);
        await this.notifications.ticketEscalated(ticket, supervisors);
      }

      await this.repository.update(ticket);
    }

    return { evaluated: active.length, escalated };
  }

  private async refreshSlaState(ticket: Ticket): Promise<Ticket> {
    const evaluated = evaluateSla(ticket.sla, ticket.createdAt);
    if (evaluated.isAtRisk !== ticket.sla.isAtRisk || evaluated.isBreached !== ticket.sla.isBreached) {
      ticket.sla = evaluated;
      ticket.updatedAt = new Date().toISOString();
      return this.repository.update(ticket);
    }
    return ticket;
  }

  private async findLeastLoadedAgent(teamId?: string): Promise<string | undefined> {
    const agents = this.users.listAgents(teamId);
    if (agents.length === 0) return undefined;

    const loads = await Promise.all(agents.map(async (agent) => ({
      id: agent.id,
      count: (await this.repository.list({ assignedAgentId: agent.id, includeClosed: false })).length
    })));

    loads.sort((a, b) => a.count - b.count || a.id.localeCompare(b.id));
    return loads[0]?.id;
  }

  private async storeAttachment(ticketId: string, file: UploadedFileInput, uploadedBy: string): Promise<Attachment> {
    const stored = await this.storage.store({
      ticketId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer
    });

    return {
      id: `ATT-${randomUUID().slice(0, 8)}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey: stored.storageKey,
      uploadedBy,
      uploadedAt: new Date().toISOString()
    };
  }

  private constrainFilters(filters: TicketFilters, actor: AuthUser): TicketFilters {
    if (actor.role === 'REQUESTER') {
      return { ...filters, requesterId: actor.id };
    }
    if (actor.role === 'AGENT') {
      return { ...filters, teamId: actor.teamId };
    }
    return filters;
  }

  private async loadAuthorized(id: string, actor: AuthUser): Promise<Ticket> {
    const ticket = assertFound(await this.repository.getById(id), 'Ticket not found');
    if (actor.role === 'REQUESTER' && ticket.requesterId !== actor.id) {
      throw new HttpError(403, 'You can only access your own tickets');
    }
    if (actor.role === 'AGENT' && ticket.teamId && actor.teamId && ticket.teamId !== actor.teamId) {
      throw new HttpError(403, 'You can only access tickets for your team');
    }
    return ticket;
  }

  private ensureSupportAccess(ticket: Ticket, actor: AuthUser): void {
    if (actor.role === 'REQUESTER') {
      throw new HttpError(403, 'Support role required');
    }
    if (actor.role === 'AGENT' && ticket.assignedAgentId && ticket.assignedAgentId !== actor.id) {
      throw new HttpError(403, 'Only the assigned agent, supervisors or admins can modify this ticket');
    }
  }

  private present(ticket: Ticket, actor: AuthUser): Ticket {
    const copy = structuredClone(ticket);
    if (actor.role === 'REQUESTER') {
      copy.comments = copy.comments.filter((comment) => comment.visibility === 'PUBLIC');
      copy.auditLog = copy.auditLog.filter((event) => ['TICKET_CREATED', 'STATUS_CHANGED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED'].includes(event.type));
    }
    return copy;
  }

  private audit(type: AuditEvent['type'], actorId: string, reason?: string, from?: unknown, to?: unknown): AuditEvent {
    return { id: `AUD-${randomUUID().slice(0, 8)}`, type, actorId, at: new Date().toISOString(), reason, from, to };
  }
}

export function isTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === 'string' && ticketPriorities.includes(value as TicketPriority);
}
