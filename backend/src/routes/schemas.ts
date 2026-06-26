import { z } from 'zod';
import { auditEventTypes, ticketPriorities, ticketStatuses } from '../domain/enums';

const booleanQuery = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(160),
    description: z.string().min(10).max(5000),
    category: z.string().min(2).max(80),
    priority: z.enum(ticketPriorities).optional(),
    assignedAgentId: z.string().optional(),
    teamId: z.string().optional()
  })
});

export const ticketIdParamsSchema = z.object({
  params: z.object({ ticketId: z.string().min(1) })
});

export const attachmentParamsSchema = z.object({
  params: z.object({ ticketId: z.string().min(1), attachmentId: z.string().min(1) })
});

export const listTicketsSchema = z.object({
  query: z.object({
    requesterId: z.string().optional(),
    assignedAgentId: z.string().optional(),
    teamId: z.string().optional(),
    priority: z.enum(ticketPriorities).optional(),
    status: z.enum(ticketStatuses).optional(),
    category: z.string().optional(),
    slaAtRisk: booleanQuery.optional(),
    includeClosed: booleanQuery.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  })
});

export const updateStatusSchema = z.object({
  params: z.object({ ticketId: z.string().min(1) }),
  body: z.object({
    status: z.enum(ticketStatuses),
    reason: z.string().max(500).optional()
  })
});

export const assignTicketSchema = z.object({
  params: z.object({ ticketId: z.string().min(1) }),
  body: z.object({
    assignedAgentId: z.string().min(1),
    reason: z.string().max(500).optional()
  })
});

export const addCommentSchema = z.object({
  params: z.object({ ticketId: z.string().min(1) }),
  body: z.object({
    content: z.string().min(1).max(5000),
    visibility: z.enum(['PUBLIC', 'INTERNAL']).default('PUBLIC')
  })
});

export const reportSchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  })
});

export const asyncEnqueueSchema = z.object({
  body: z.unknown().refine((value) => value !== undefined, 'JSON body is required')
});

export const ticketHistorySchema = z.object({
  params: z.object({ ticketId: z.string().min(1) }),
  query: z.object({
    type: z.enum(auditEventTypes).optional(),
    limit: z.preprocess(
      (v) => (v !== undefined ? Number(v) : undefined),
      z.number().int().min(1).max(100).default(50)
    ).optional(),
    cursor: z.string().optional()
  })
});
