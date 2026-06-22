import { env } from './config/env';
import { logger } from './config/logger';
import { createApp } from './app';
import { createServices } from './services/container';
import { startSlaJob } from './jobs/sla-job';

const services = createServices();
const app = createApp(services);

startSlaJob(services.tickets);
services.asyncConsumer.start();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV, apiPrefix: env.API_PREFIX }, 'TicketFlow backend listening');
});
