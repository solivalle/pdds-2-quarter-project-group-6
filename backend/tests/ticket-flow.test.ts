import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createServices } from '../src/services/container';

async function login(app: ReturnType<typeof createApp>, email: string): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'demo123' })
    .expect(200);
  return response.body.token as string;
}

describe('TicketFlow API', () => {
  it('creates, lists and updates a ticket with role-based visibility', async () => {
    const app = createApp(createServices());
    const requesterToken = await login(app, 'ana@ticketflow.local');
    const agentToken = await login(app, 'luis@ticketflow.local');

    const created = await request(app)
      .post('/api/v1/tickets')
      .set('authorization', `Bearer ${requesterToken}`)
      .send({ title: 'Error 500 al procesar pago', description: 'El sistema muestra error 500 cuando intento pagar.', category: 'pagos' })
      .expect(201);

    expect(created.body.data.id).toMatch(/^TKT-/);
    expect(created.body.data.priority).toBe('P1');
    const ticketId = created.body.data.id as string;

    await request(app)
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('authorization', `Bearer ${agentToken}`)
      .send({ content: 'Revisando logs internos.', visibility: 'INTERNAL' })
      .expect(201);

    const requesterView = await request(app)
      .get(`/api/v1/tickets/${ticketId}`)
      .set('authorization', `Bearer ${requesterToken}`)
      .expect(200);
    expect(requesterView.body.data.comments).toHaveLength(0);

    const updated = await request(app)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .set('authorization', `Bearer ${agentToken}`)
      .send({ status: 'IN_PROGRESS', reason: 'Agent started working' })
      .expect(200);
    expect(updated.body.data.status).toBe('IN_PROGRESS');
  });
});
