import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { TicketService } from '../services/ticket-service';

export function startSlaJob(tickets: TicketService): void {
  if (!env.SLA_JOB_ENABLED) {
    logger.info('SLA job disabled');
    return;
  }

  cron.schedule(env.SLA_JOB_CRON, async () => {
    try {
      const result = await tickets.evaluateAndEscalateOverdueTickets();
      logger.info(result, 'SLA evaluation completed');
    } catch (error) {
      logger.error({ error }, 'SLA evaluation failed');
    }
  });

  logger.info({ cron: env.SLA_JOB_CRON }, 'SLA job scheduled');
}
