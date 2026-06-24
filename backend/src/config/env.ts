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
  QUEUE_URL: z.string().optional(),
  DLQ_URL: z.string().optional(),
  ASYNC_QUEUE_URL: z.string().optional(),
  ASYNC_DLQ_URL: z.string().optional(),
  ASYNC_BUCKET_NAME: z.string().optional(),
  ASYNC_POLLING_ENABLED: booleanEnv.default(false),
  ASYNC_POLL_BATCH_SIZE: z.coerce.number().int().min(1).max(10).default(1),
  ASYNC_POLL_WAIT_TIME_SECONDS: z.coerce.number().int().min(0).max(20).default(10),
  ASYNC_POLL_INTERVAL_MS: z.coerce.number().int().min(250).default(1000),
  LOCAL_ATTACHMENTS_DIR: z.string().default('./uploads'),
  FRONTEND_DIST_DIR: z.string().default('./public'),
  SLA_POLICY_PRESET: z.enum(['standard', 'demo']).default('demo'),
  SLA_JOB_CRON: z.string().default('* * * * *'),
  SLA_JOB_ENABLED: booleanEnv.default(true),
  BUSINESS_HOURS_START: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  BUSINESS_HOURS_END: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  BUSINESS_TIMEZONE: z.string().default('America/Guatemala'),
  DEFAULT_USERS_JSON: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  ASYNC_QUEUE_URL: parsedEnv.ASYNC_QUEUE_URL ?? parsedEnv.QUEUE_URL,
  ASYNC_DLQ_URL: parsedEnv.ASYNC_DLQ_URL ?? parsedEnv.DLQ_URL,
  ASYNC_BUCKET_NAME: parsedEnv.ASYNC_BUCKET_NAME ?? parsedEnv.S3_ATTACHMENTS_BUCKET
};
