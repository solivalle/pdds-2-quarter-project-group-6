export const ticketPriorities = ['P0', 'P1', 'P2', 'P3', 'P4'] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export const ticketStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

export const userRoles = ['REQUESTER', 'AGENT', 'SUPERVISOR', 'ADMIN'] as const;
export type UserRole = (typeof userRoles)[number];

export const auditEventTypes = [
  'TICKET_CREATED',
  'STATUS_CHANGED',
  'ASSIGNED',
  'REASSIGNED',
  'COMMENT_ADDED',
  'ATTACHMENT_ADDED',
  'PRIORITY_CHANGED',
  'SLA_ESCALATED',
  'SLA_RECALCULATED'
] as const;
export type AuditEventType = (typeof auditEventTypes)[number];
