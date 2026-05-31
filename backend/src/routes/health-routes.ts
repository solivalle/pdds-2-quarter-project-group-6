import { Router } from 'express';

export function healthRoutes(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ticketflow-backend', timestamp: new Date().toISOString() });
  });

  return router;
}
