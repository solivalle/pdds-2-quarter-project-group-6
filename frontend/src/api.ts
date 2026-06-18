import type { AuthUser, NotificationRecord, PerformanceReport, Ticket, TicketFilters, TicketStatus } from './types';

const API_PREFIX = '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (token) headers.set('authorization', `Bearer ${token}`);

  const response = await fetch(`${API_PREFIX}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String(payload.message)
      : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

function queryString(filters: TicketFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const value = query.toString();
  return value ? `?${value}` : '';
}

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async listTickets(token: string, filters: TicketFilters): Promise<Ticket[]> {
    const response = await request<{ data: Ticket[] }>(`/tickets${queryString(filters)}`, {}, token);
    return response.data;
  },

  async createTicket(token: string, input: {
    title: string;
    description: string;
    category: string;
    priority?: string;
    teamId?: string;
  }): Promise<Ticket> {
    const response = await request<{ data: Ticket }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(input)
    }, token);
    return response.data;
  },

  async updateStatus(token: string, ticketId: string, status: TicketStatus, reason?: string): Promise<Ticket> {
    const response = await request<{ data: Ticket }>(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    }, token);
    return response.data;
  },

  async assignTicket(token: string, ticketId: string, assignedAgentId: string, reason?: string): Promise<Ticket> {
    const response = await request<{ data: Ticket }>(`/tickets/${ticketId}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedAgentId, reason })
    }, token);
    return response.data;
  },

  async addComment(token: string, ticketId: string, content: string, visibility: 'PUBLIC' | 'INTERNAL'): Promise<Ticket> {
    const response = await request<{ data: Ticket }>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, visibility })
    }, token);
    return response.data;
  },

  async performanceReport(token: string): Promise<PerformanceReport> {
    const response = await request<{ data: PerformanceReport }>('/reports/performance', {}, token);
    return response.data;
  },

  async notifications(token: string): Promise<NotificationRecord[]> {
    const response = await request<{ data: NotificationRecord[] }>('/notifications', {}, token);
    return response.data;
  }
};
