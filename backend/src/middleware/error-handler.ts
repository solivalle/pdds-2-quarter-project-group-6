import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { HttpError } from '../utils/http-error';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.flatten()
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: 'HTTP_ERROR', message: error.message, details: error.details });
    return;
  }

  logger.error({ error }, 'Unhandled request error');
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' });
};
