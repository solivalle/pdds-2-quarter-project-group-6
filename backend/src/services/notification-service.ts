import { randomUUID } from 'crypto';
import { logger } from '../config/logger';
import { Ticket } from '../domain/types';

export type NotificationChannel = 'EMAIL' | 'SMS';

export interface NotificationRecord {
  id: string;
  ticketId: string;
  channel: NotificationChannel;
  recipient: string;
  event: string;
  status: 'SENT' | 'FAILED';
  createdAt: string;
}

export class NotificationService {
  private readonly history: NotificationRecord[] = [];

  async ticketCreated(ticket: Ticket, recipientEmail: string): Promise<void> {
    await this.send(ticket.id, 'EMAIL', recipientEmail, 'TICKET_CREATED');
  }

  async statusChanged(ticket: Ticket, recipientEmail: string): Promise<void> {
    await this.send(ticket.id, 'EMAIL', recipientEmail, 'STATUS_CHANGED');
  }

  async ticketEscalated(ticket: Ticket, recipients: string[]): Promise<void> {
    await Promise.all(recipients.flatMap((recipient) => [
      this.send(ticket.id, 'EMAIL', recipient, 'SLA_ESCALATED'),
      ['P0', 'P1'].includes(ticket.priority) ? this.send(ticket.id, 'SMS', recipient, 'SLA_ESCALATED') : Promise.resolve()
    ]));
  }

  listHistory(ticketId?: string): NotificationRecord[] {
    return this.history.filter((item) => !ticketId || item.ticketId === ticketId);
  }

  private async send(ticketId: string, channel: NotificationChannel, recipient: string, event: string): Promise<void> {
    const record: NotificationRecord = {
      id: `NOT-${randomUUID()}`,
      ticketId,
      channel,
      recipient,
      event,
      status: 'SENT',
      createdAt: new Date().toISOString()
    };
    this.history.push(record);
    logger.info({ notification: record }, 'Notification queued');
  }
}
