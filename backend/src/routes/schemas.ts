import { z } from 'zod';
import { ticketPriorities, ticketStatuses } from '../domain/enums';

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
    slaAtRisk: z.coerce.boolean().optional(),
    includeClosed: z.coerce.boolean().optional(),
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
