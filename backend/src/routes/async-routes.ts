import { Request, Router } from 'express';
import { validate } from '../middleware/validate';
import { AsyncMessageService } from '../services/async-message-service';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { asyncEnqueueSchema } from './schemas';

export function asyncRoutes(asyncMessages: AsyncMessageService): Router {
  const router = Router();

  router.post('/enqueue', validate(asyncEnqueueSchema), asyncHandler(async (req, res) => {
    const result = await asyncMessages.enqueue(req.body, requireUser(req));
    res.status(202).json({ messageId: result.messageId });
  }));

  return router;
}

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}
