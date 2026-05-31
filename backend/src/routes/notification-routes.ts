import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { NotificationService } from '../services/notification-service';
import { asyncHandler } from '../utils/async-handler';

export function notificationRoutes(notifications: NotificationService): Router {
  const router = Router();

  router.get('/', requireRole('SUPERVISOR', 'ADMIN'), asyncHandler(async (req, res) => {
    const ticketId = typeof req.query.ticketId === 'string' ? req.query.ticketId : undefined;
    res.json({ data: notifications.listHistory(ticketId) });
  }));

  return router;
}
