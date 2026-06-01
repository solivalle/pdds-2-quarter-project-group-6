import { env } from '../config/env';
import { AttachmentStorage } from '../data/attachment-storage';
import { DynamoDbTicketRepository } from '../data/dynamodb-ticket-repository';
import { LocalAttachmentStorage } from '../data/local-attachment-storage';
import { MemoryTicketRepository } from '../data/memory-ticket-repository';
import { S3AttachmentStorage } from '../data/s3-attachment-storage';
import { TicketRepository } from '../data/ticket-repository';
import { AuthService } from './auth-service';
import { NotificationService } from './notification-service';
import { ReportService } from './report-service';
import { TicketService } from './ticket-service';
import { UserService } from './user-service';

export interface AppServices {
  users: UserService;
  auth: AuthService;
  notifications: NotificationService;
  tickets: TicketService;
  reports: ReportService;
  repository: TicketRepository;
  storage: AttachmentStorage;
}

export function createServices(overrides: Partial<AppServices> = {}): AppServices {
  const users = overrides.users ?? new UserService();
  const auth = overrides.auth ?? new AuthService(users);
  const notifications = overrides.notifications ?? new NotificationService();
  const repository = overrides.repository ?? (env.DATA_STORE === 'dynamodb' ? new DynamoDbTicketRepository() : new MemoryTicketRepository());
  const storage = overrides.storage ?? (env.ATTACHMENT_STORE === 's3' ? new S3AttachmentStorage() : new LocalAttachmentStorage());
  const tickets = overrides.tickets ?? new TicketService(repository, storage, users, notifications);
  const reports = overrides.reports ?? new ReportService(repository);

  return { users, auth, notifications, tickets, reports, repository, storage };
}
