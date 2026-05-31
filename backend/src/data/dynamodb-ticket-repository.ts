import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { env } from '../config/env';
import { Ticket, TicketFilters } from '../domain/types';
import { TicketRepository } from './ticket-repository';

interface TicketItem extends Omit<Ticket, 'id' | 'assignedAgentId' | 'ttlEpochSeconds'> {
  TicketID: string;
  AgentID?: string;
  TimeToExist?: number;
}

function toItem(ticket: Ticket): TicketItem {
  const { id, assignedAgentId, ttlEpochSeconds, ...rest } = ticket;
  return {
    ...rest,
    TicketID: id,
    AgentID: assignedAgentId,
    TimeToExist: ttlEpochSeconds
  };
}

function fromItem(item: TicketItem): Ticket {
  const { TicketID, AgentID, TimeToExist, ...rest } = item;
  return {
    ...rest,
    id: TicketID,
    assignedAgentId: AgentID,
    ttlEpochSeconds: TimeToExist
  };
}

export class DynamoDbTicketRepository implements TicketRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(private readonly tableName = env.DYNAMODB_TICKETS_TABLE) {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: env.AWS_REGION }), {
      marshallOptions: { removeUndefinedValues: true }
    });
  }

  async create(ticket: Ticket): Promise<Ticket> {
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: toItem(ticket), ConditionExpression: 'attribute_not_exists(TicketID)' }));
    return ticket;
  }

  async getById(id: string): Promise<Ticket | undefined> {
    const result = await this.client.send(new GetCommand({ TableName: this.tableName, Key: { TicketID: id } }));
    return result.Item ? fromItem(result.Item as TicketItem) : undefined;
  }

  async update(ticket: Ticket): Promise<Ticket> {
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: toItem(ticket) }));
    return ticket;
  }

  async list(filters: TicketFilters = {}): Promise<Ticket[]> {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const expressions: string[] = [];

    const addEquals = (field: string, value: unknown): void => {
      const nameKey = `#${field}`;
      const valueKey = `:${field}`;
      names[nameKey] = field;
      values[valueKey] = value;
      expressions.push(`${nameKey} = ${valueKey}`);
    };

    if (filters.requesterId) addEquals('requesterId', filters.requesterId);
    if (filters.assignedAgentId) addEquals('AgentID', filters.assignedAgentId);
    if (filters.teamId) addEquals('teamId', filters.teamId);
    if (filters.priority) addEquals('priority', filters.priority);
    if (filters.status) addEquals('status', filters.status);
    if (filters.category) addEquals('category', filters.category);

    const result = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: expressions.length ? expressions.join(' AND ') : undefined,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined
    }));

    return (result.Items ?? [])
      .map((item) => fromItem(item as TicketItem))
      .filter((ticket) => {
        if (filters.slaAtRisk !== undefined && ticket.sla.isAtRisk !== filters.slaAtRisk) return false;
        if (!filters.includeClosed && ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status)) return false;
        if (filters.from && ticket.createdAt < filters.from) return false;
        if (filters.to && ticket.createdAt > filters.to) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
