import { AuditEventType, TicketPriority, TicketStatus, UserRole } from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  supervisorId?: string;
  passwordHash?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  supervisorId?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorRole: UserRole;
  content: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actorId: string;
  at: string;
  reason?: string;
  from?: unknown;
  to?: unknown;
}

export interface SlaSnapshot {
  responseDueAt: string;
  resolutionDueAt: string;
  responseMinutes: number;
  resolutionMinutes: number;
  firstResponseAt?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  isAtRisk: boolean;
  isBreached: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  suggestedPriority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  assignedAgentId?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  escalated: boolean;
  sla: SlaSnapshot;
  attachments: Attachment[];
  comments: Comment[];
  auditLog: AuditEvent[];
  ttlEpochSeconds?: number;
}

export interface TicketFilters {
  requesterId?: string;
  assignedAgentId?: string;
  teamId?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: string;
  slaAtRisk?: boolean;
  includeClosed?: boolean;
  from?: string;
  to?: string;
}
