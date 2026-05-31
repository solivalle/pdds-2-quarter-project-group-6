import { TicketRepository } from './ticket-repository';
import { Ticket, TicketFilters } from '../domain/types';

export class MemoryTicketRepository implements TicketRepository {
  private readonly tickets = new Map<string, Ticket>();

  async create(ticket: Ticket): Promise<Ticket> {
    this.tickets.set(ticket.id, structuredClone(ticket));
    return structuredClone(ticket);
  }

  async getById(id: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    return ticket ? structuredClone(ticket) : undefined;
  }

  async update(ticket: Ticket): Promise<Ticket> {
    this.tickets.set(ticket.id, structuredClone(ticket));
    return structuredClone(ticket);
  }

  async list(filters: TicketFilters = {}): Promise<Ticket[]> {
    const tickets = Array.from(this.tickets.values()).filter((ticket) => {
      if (filters.requesterId && ticket.requesterId !== filters.requesterId) return false;
      if (filters.assignedAgentId && ticket.assignedAgentId !== filters.assignedAgentId) return false;
      if (filters.teamId && ticket.teamId !== filters.teamId) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.category && ticket.category !== filters.category) return false;
      if (filters.slaAtRisk !== undefined && ticket.sla.isAtRisk !== filters.slaAtRisk) return false;
      if (!filters.includeClosed && ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status)) return false;
      if (filters.from && ticket.createdAt < filters.from) return false;
      if (filters.to && ticket.createdAt > filters.to) return false;
      return true;
    });

    return structuredClone(tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
}
