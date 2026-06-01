import { Router } from 'express';
import { AuthService } from '../services/auth-service';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { loginSchema } from './schemas';

export function authRoutes(auth: AuthService): Router {
  const router = Router();

  router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
    const result = await auth.login(req.body.email, req.body.password);
    res.json(result);
  }));

  return router;
}
