import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../domain/types';
import { HttpError } from '../utils/http-error';
import { UserService } from './user-service';

export class AuthService {
  constructor(private readonly users: UserService) {}

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const user = this.users.findByEmail(email);
    if (!user?.passwordHash) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const authUser = this.users.toAuthUser(user);
    const token = jwt.sign(authUser, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
    return { token, user: authUser };
  }

  verify(token: string): AuthUser {
    try {
      return jwt.verify(token, env.JWT_SECRET) as AuthUser;
    } catch {
      throw new HttpError(401, 'Invalid or expired token');
    }
  }
}
