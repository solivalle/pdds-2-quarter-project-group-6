import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { AuthUser, User } from '../domain/types';

const defaultUsers: Array<Omit<User, 'passwordHash'> & { password: string }> = [
  { id: 'USR-1001', name: 'Ana Solicitante', email: 'ana@ticketflow.local', role: 'REQUESTER', password: 'demo123' },
  { id: 'AGE-2001', name: 'Luis Agente', email: 'luis@ticketflow.local', role: 'AGENT', teamId: 'support-core', supervisorId: 'SUP-3001', password: 'demo123' },
  { id: 'AGE-2002', name: 'Maria Agente', email: 'maria@ticketflow.local', role: 'AGENT', teamId: 'support-core', supervisorId: 'SUP-3001', password: 'demo123' },
  { id: 'SUP-3001', name: 'Sofia Supervisora', email: 'sofia@ticketflow.local', role: 'SUPERVISOR', teamId: 'support-core', password: 'demo123' },
  { id: 'ADM-4001', name: 'Admin TicketFlow', email: 'admin@ticketflow.local', role: 'ADMIN', password: 'demo123' }
];

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    supervisorId: user.supervisorId
  };
}

export class UserService {
  private readonly users: User[];

  constructor() {
    this.users = this.loadUsers();
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  findById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  listAgents(teamId?: string): AuthUser[] {
    return this.users.filter((user) => user.role === 'AGENT' && (!teamId || user.teamId === teamId)).map(toAuthUser);
  }

  listSupervisors(teamId?: string): AuthUser[] {
    return this.users.filter((user) => ['SUPERVISOR', 'ADMIN'].includes(user.role) && (!teamId || user.teamId === teamId || user.role === 'ADMIN')).map(toAuthUser);
  }

  toAuthUser(user: User): AuthUser {
    return toAuthUser(user);
  }

  private loadUsers(): User[] {
    const rawUsers: Array<Record<string, unknown>> = env.DEFAULT_USERS_JSON ? JSON.parse(env.DEFAULT_USERS_JSON) as Array<Record<string, unknown>> : defaultUsers;
    return rawUsers.map((raw) => {
      const password = String(raw.password ?? 'demo123');
      const passwordHash = typeof raw.passwordHash === 'string' ? raw.passwordHash : bcrypt.hashSync(password, 10);
      return {
        id: String(raw.id),
        name: String(raw.name),
        email: String(raw.email),
        role: raw.role as User['role'],
        teamId: typeof raw.teamId === 'string' ? raw.teamId : undefined,
        supervisorId: typeof raw.supervisorId === 'string' ? raw.supervisorId : undefined,
        passwordHash
      };
    });
  }
}
