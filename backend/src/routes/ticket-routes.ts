import { Request, Router } from 'express';
import multer from 'multer';
import { requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { TicketService } from '../services/ticket-service';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import {
  addCommentSchema,
  assignTicketSchema,
  attachmentParamsSchema,
  createTicketSchema,
  listTicketsSchema,
  ticketIdParamsSchema,
  updateStatusSchema
} from './schemas';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }
});

export function ticketRoutes(tickets: TicketService): Router {
  const router = Router();

  router.get('/', validate(listTicketsSchema), asyncHandler(async (req, res) => {
    res.json({ data: await tickets.listTickets(req.query, requireUser(req)) });
  }));

  router.post('/', upload.array('attachments'), validate(createTicketSchema), asyncHandler(async (req, res) => {
    const created = await tickets.createTicket({ ...req.body, attachments: requestFiles(req) }, requireUser(req));
    res.status(201).json({ data: created });
  }));

  router.get('/:ticketId', validate(ticketIdParamsSchema), asyncHandler(async (req, res) => {
    res.json({ data: await tickets.getTicket(param(req, 'ticketId'), requireUser(req)) });
  }));

  router.patch('/:ticketId/status', requireRole('AGENT', 'SUPERVISOR', 'ADMIN'), validate(updateStatusSchema), asyncHandler(async (req, res) => {
    res.json({ data: await tickets.updateStatus(param(req, 'ticketId'), req.body, requireUser(req)) });
  }));

  router.patch('/:ticketId/assignment', requireRole('AGENT', 'SUPERVISOR', 'ADMIN'), validate(assignTicketSchema), asyncHandler(async (req, res) => {
    res.json({ data: await tickets.assignTicket(param(req, 'ticketId'), req.body.assignedAgentId, requireUser(req), req.body.reason) });
  }));

  router.post('/:ticketId/comments', validate(addCommentSchema), asyncHandler(async (req, res) => {
    res.status(201).json({ data: await tickets.addComment(param(req, 'ticketId'), req.body, requireUser(req)) });
  }));

  router.post('/:ticketId/attachments', upload.array('attachments'), validate(ticketIdParamsSchema), asyncHandler(async (req, res) => {
    res.status(201).json({ data: await tickets.addAttachments(param(req, 'ticketId'), requestFiles(req), requireUser(req)) });
  }));

  router.get('/:ticketId/attachments/:attachmentId/url', validate(attachmentParamsSchema), asyncHandler(async (req, res) => {
    res.json({ data: await tickets.getAttachmentUrl(param(req, 'ticketId'), param(req, 'attachmentId'), requireUser(req)) });
  }));

  router.get('/:ticketId/attachments/:attachmentId/download', validate(attachmentParamsSchema), asyncHandler(async (req, res) => {
    const file = await tickets.downloadAttachment(param(req, 'ticketId'), param(req, 'attachmentId'), requireUser(req));
    res.header('content-type', file.mimeType);
    res.attachment(file.attachment.fileName);
    res.send(file.buffer);
  }));

  return router;
}

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}

function param(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw new HttpError(400, `Missing route param ${name}`);
  return value;
}

function requestFiles(req: Request): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}
