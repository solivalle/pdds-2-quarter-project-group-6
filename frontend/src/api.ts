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

function ticketFormData(input: {
  title: string;
  description: string;
  category: string;
  priority?: string;
  teamId?: string;
  attachments?: File[];
}): FormData {
  const data = new FormData();
  data.set('title', input.title);
  data.set('description', input.description);
  data.set('category', input.category);
  if (input.priority) data.set('priority', input.priority);
  if (input.teamId) data.set('teamId', input.teamId);
  for (const file of input.attachments ?? []) {
    data.append('attachments', file);
  }
  return data;
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
    attachments?: File[];
  }): Promise<Ticket> {
    const response = await request<{ data: Ticket }>('/tickets', {
      method: 'POST',
      body: ticketFormData(input)
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

  async addAttachments(token: string, ticketId: string, attachments: File[]): Promise<Ticket> {
    const data = new FormData();
    for (const file of attachments) {
      data.append('attachments', file);
    }
    const response = await request<{ data: Ticket }>(`/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: data
    }, token);
    return response.data;
  },

  async downloadAttachment(token: string, ticketId: string, attachmentId: string): Promise<Blob> {
    const response = await fetch(`${API_PREFIX}/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      headers: { authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new ApiError(`No se pudo descargar el adjunto (${response.status})`, response.status);
    }

    return response.blob();
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
