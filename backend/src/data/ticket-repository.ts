import { Ticket, TicketFilters } from '../domain/types';

export interface TicketRepository {
  create(ticket: Ticket): Promise<Ticket>;
  getById(id: string): Promise<Ticket | undefined>;
  update(ticket: Ticket): Promise<Ticket>;
  list(filters: TicketFilters): Promise<Ticket[]>;
}
