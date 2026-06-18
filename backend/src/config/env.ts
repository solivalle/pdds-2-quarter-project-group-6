import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanEnv = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(16).default('development-ticketflow-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  DATA_STORE: z.enum(['local-memory', 'dynamodb']).default('local-memory'),
  AWS_REGION: z.string().default('us-west-2'),
  DYNAMODB_TICKETS_TABLE: z.string().default('pdds-2-quarter-project-group-6-dev-tickets'),
  ATTACHMENT_STORE: z.enum(['local', 's3']).default('local'),
  S3_ATTACHMENTS_BUCKET: z.string().default('ticketflow-dev-attachments'),
  LOCAL_ATTACHMENTS_DIR: z.string().default('./uploads'),
  FRONTEND_DIST_DIR: z.string().default('./public'),
  SLA_JOB_CRON: z.string().default('*/5 * * * *'),
  SLA_JOB_ENABLED: booleanEnv.default(true),
  BUSINESS_HOURS_START: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  BUSINESS_HOURS_END: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  BUSINESS_TIMEZONE: z.string().default('America/Guatemala'),
  DEFAULT_USERS_JSON: z.string().optional()
});

export const env = envSchema.parse(process.env);
