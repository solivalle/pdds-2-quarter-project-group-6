import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
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
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
