import { RequestHandler } from 'express';
import { UserRole } from '../domain/enums';
import { AuthService } from '../services/auth-service';
import { HttpError } from '../utils/http-error';

export function requireAuth(auth: AuthService): RequestHandler {
  return (req, _res, next) => {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) {
      next(new HttpError(401, 'Missing bearer token'));
      return;
    }

    try {
      req.user = auth.verify(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
