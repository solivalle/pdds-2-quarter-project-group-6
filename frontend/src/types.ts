export type UserRole = 'REQUESTER' | 'AGENT' | 'SUPERVISOR' | 'ADMIN';
export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  supervisorId?: string;
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

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
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
}

export interface PerformanceReport {
  generatedAt: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionMinutes: number | null;
  slaComplianceRate: number;
  ticketsByAgent: Array<{ agentId: string; total: number; resolved: number }>;
  ticketsByCategory: Array<{ category: string; total: number }>;
  ticketsByPriority: Array<{ priority: string; total: number }>;
}

export interface NotificationRecord {
  id: string;
  ticketId: string;
  channel: 'EMAIL' | 'SMS';
  recipient: string;
  event: string;
  status: 'SENT' | 'FAILED';
  createdAt: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  slaAtRisk?: boolean;
  includeClosed?: boolean;
}
