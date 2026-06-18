import { expect, type Page, test } from '@playwright/test';

const users = {
  requester: 'ana@ticketflow.local',
  agent: 'luis@ticketflow.local',
  supervisor: 'sofia@ticketflow.local'
};

async function login(page: Page, userButton: RegExp, expectedRole: string) {
  await page.goto('/');
  await page.getByRole('button', { name: userButton }).click();
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await expect(page.getByRole('heading', { name: /Panel operativo/i })).toBeVisible();
  await expect(page.locator('.topbar .eyebrow')).toHaveText(expectedRole);
}

async function createTicket(page: Page, title: string, options: { priority?: string; category?: string } = {}) {
  const form = page.getByRole('region', { name: /Nuevo ticket/i });
  await form.getByLabel(/Titulo/i).fill(title);
  await form.getByLabel(/Categoria/i).fill(options.category ?? 'plataforma');
  if (options.priority) {
    await form.getByLabel(/Prioridad/i).selectOption(options.priority);
  }
  await form.getByLabel(/Descripcion/i).fill('La aplicacion muestra un error al cargar el panel principal y requiere seguimiento.');
  await form.getByRole('button', { name: /Crear ticket/i }).click();
  await expect(page.getByText(/Ticket creado/i)).toBeVisible();
  await expect(page.getByRole('table')).toContainText(title);
}

test('GUI-01 login exitoso como solicitante', async ({ page }) => {
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await expect(page.getByText(/Ana Solicitante/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Reportes/i })).toHaveCount(0);
});

test('GUI-02 login fallido muestra mensaje de error', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/Correo/i).fill(users.requester);
  await page.getByLabel(/Password/i).fill('password-incorrecto');
  await page.getByRole('button', { name: /Ingresar/i }).click();

  await expect(page.getByRole('alert')).toContainText(/Invalid credentials/i);
  await expect(page.getByRole('heading', { name: /Iniciar sesion/i })).toBeVisible();
});

test('GUI-03 crear ticket como solicitante', async ({ page }) => {
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await createTicket(page, `GUI-03 ticket ${Date.now()}`);
});

test('GUI-04 listar tickets y ver columnas principales', async ({ page }) => {
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await createTicket(page, `GUI-04 listado ${Date.now()}`);

  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader', { name: /Ticket/i })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: /Prioridad/i })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: /Estado/i })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: /SLA/i })).toBeVisible();
});

test('GUI-05 filtrar tickets por prioridad', async ({ page }) => {
  const title = `GUI-05 prioridad ${Date.now()}`;
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await createTicket(page, title, { priority: 'P1', category: 'pagos' });

  await page.getByLabel('Prioridad', { exact: true }).selectOption('P1');
  await expect(page.getByRole('table')).toContainText(title);
  await expect(page.getByRole('table')).toContainText('P1');
});

test('GUI-06 filtrar tickets por estado', async ({ page }) => {
  const title = `GUI-06 estado ${Date.now()}`;
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await createTicket(page, title);

  await page.getByLabel('Estado', { exact: true }).selectOption('ASSIGNED');
  await expect(page.getByRole('table')).toContainText(title);
  await expect(page.getByRole('table')).toContainText('ASSIGNED');
});

test('GUI-07 seleccionar ticket y ver detalle', async ({ page }) => {
  const title = `GUI-07 detalle ${Date.now()}`;
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await createTicket(page, title);

  await page.getByRole('button', { name: new RegExp(title) }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText(/Vence respuesta/i)).toBeVisible();
  await expect(page.getByText(/Vence resolucion/i)).toBeVisible();
});

test('GUI-08 agregar comentario a un ticket', async ({ page }) => {
  const title = `GUI-08 comentario ${Date.now()}`;
  const comment = `Seguimiento GUI-08 ${Date.now()}`;
  await login(page, /Ana Solicitante/i, 'REQUESTER');
  await createTicket(page, title);

  await page.getByRole('textbox', { name: 'Comentario' }).fill(comment);
  await page.getByRole('button', { name: 'Comentar', exact: true }).click();
  await expect(page.getByText(/Comentario agregado/i)).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: comment })).toBeVisible();
});

test('GUI-09 supervisor navega a reportes separados', async ({ page }) => {
  await login(page, /Sofia Supervisora/i, 'SUPERVISOR');

  await page.getByRole('button', { name: /Reportes/i }).click();
  await expect(page.getByRole('heading', { name: /^Reportes$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Rendimiento del servicio/i })).toBeVisible();
  await expect(page.getByText(/Tickets totales/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Notificaciones$/i })).toHaveCount(0);
});

test('GUI-10 supervisor navega a notificaciones separadas', async ({ page }) => {
  await login(page, /Sofia Supervisora/i, 'SUPERVISOR');

  await page.getByRole('button', { name: /Notificaciones/i }).click();
  await expect(page.locator('h1')).toHaveText('Notificaciones');
  await expect(page.getByText(/eventos registrados/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Rendimiento del servicio/i })).toHaveCount(0);
});
