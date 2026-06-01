export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function assertFound<T>(value: T | undefined | null, message = 'Resource not found'): T {
  if (value === undefined || value === null) {
    throw new HttpError(404, message);
  }
  return value;
}
