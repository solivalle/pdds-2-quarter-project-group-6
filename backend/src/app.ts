import cors from 'cors';
import express from 'express';
import { existsSync } from 'fs';
import helmet from 'helmet';
import path from 'path';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { AppServices } from './services/container';
import { authRoutes } from './routes/auth-routes';
import { healthRoutes } from './routes/health-routes';
import { notificationRoutes } from './routes/notification-routes';
import { reportRoutes } from './routes/report-routes';
import { ticketRoutes } from './routes/ticket-routes';

export function createApp(services: AppServices): express.Express {
  const app = express();
  const api = express.Router();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.use(healthRoutes());

  api.use('/auth', authRoutes(services.auth));
  api.use(requireAuth(services.auth));
  api.use('/tickets', ticketRoutes(services.tickets));
  api.use('/reports', reportRoutes(services.reports));
  api.use('/notifications', notificationRoutes(services.notifications));

  app.use(env.API_PREFIX, api);
  serveFrontend(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function serveFrontend(app: express.Express): void {
  const frontendDistDir = path.resolve(env.FRONTEND_DIST_DIR);
  const indexPath = path.join(frontendDistDir, 'index.html');

  if (!existsSync(indexPath)) {
    logger.warn({ frontendDistDir }, 'Frontend build not found; serving API only');
    return;
  }

  app.use(express.static(frontendDistDir, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith(env.API_PREFIX) || req.path === '/health' || !req.accepts('html')) {
      next();
      return;
    }

    res.sendFile(indexPath);
  });
}
