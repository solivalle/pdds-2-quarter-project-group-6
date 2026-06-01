import { TicketRepository } from '../data/ticket-repository';
import { Ticket } from '../domain/types';

export interface ReportFilters {
  from?: string;
  to?: string;
}

export interface PerformanceReport {
  generatedAt: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionMinutes: number | null;
  slaComplianceRate: number;
  ticketsByAgent: Array<{ agentId: string; total: number; resolved: number }>;
  ticketsByCategory: Array<{ category: string; total: number }>;
  ticketsByPriority: Array<{ priority: string; total: number }>;
}

export class ReportService {
  constructor(private readonly repository: TicketRepository) {}

  async getPerformanceReport(filters: ReportFilters): Promise<PerformanceReport> {
    const tickets = await this.repository.list({ includeClosed: true, from: filters.from, to: filters.to });
    const resolved = tickets.filter((ticket) => ticket.sla.resolvedAt || ticket.closedAt);
    const averageResolutionMinutes = resolved.length > 0
      ? Math.round(resolved.reduce((sum, ticket) => sum + this.resolutionMinutes(ticket), 0) / resolved.length)
      : null;
    const slaCompliant = resolved.filter((ticket) => {
      const resolvedAt = new Date(ticket.sla.resolvedAt ?? ticket.closedAt ?? ticket.updatedAt).getTime();
      return resolvedAt <= new Date(ticket.sla.resolutionDueAt).getTime();
    }).length;

    return {
      generatedAt: new Date().toISOString(),
      totalTickets: tickets.length,
      openTickets: tickets.filter((ticket) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status)).length,
      resolvedTickets: resolved.length,
      averageResolutionMinutes,
      slaComplianceRate: resolved.length ? Number((slaCompliant / resolved.length).toFixed(4)) : 1,
      ticketsByAgent: this.groupByAgent(tickets),
      ticketsByCategory: this.groupBy(tickets, (ticket) => ticket.category, 'category'),
      ticketsByPriority: this.groupBy(tickets, (ticket) => ticket.priority, 'priority')
    };
  }

  private resolutionMinutes(ticket: Ticket): number {
    const resolvedAt = new Date(ticket.sla.resolvedAt ?? ticket.closedAt ?? ticket.updatedAt).getTime();
    const createdAt = new Date(ticket.createdAt).getTime();
    return Math.max(0, Math.round((resolvedAt - createdAt) / 60000));
  }

  private groupByAgent(tickets: Ticket[]): Array<{ agentId: string; total: number; resolved: number }> {
    const groups = new Map<string, { total: number; resolved: number }>();
    for (const ticket of tickets) {
      const key = ticket.assignedAgentId ?? 'UNASSIGNED';
      const current = groups.get(key) ?? { total: 0, resolved: 0 };
      current.total += 1;
      if (['RESOLVED', 'CLOSED'].includes(ticket.status)) current.resolved += 1;
      groups.set(key, current);
    }
    return Array.from(groups.entries()).map(([agentId, value]) => ({ agentId, ...value })).sort((a, b) => b.total - a.total);
  }

  private groupBy<K extends 'category' | 'priority'>(tickets: Ticket[], selector: (ticket: Ticket) => string, keyName: K): Array<Record<K, string> & { total: number }> {
    const groups = new Map<string, number>();
    for (const ticket of tickets) {
      const key = selector(ticket);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return Array.from(groups.entries()).map(([key, total]) => ({ [keyName]: key, total }) as Record<K, string> & { total: number }).sort((a, b) => b.total - a.total);
  }
}
