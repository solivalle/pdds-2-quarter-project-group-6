# TicketFlow Backend

Backend Node.js/Express para TicketFlow, alineado con las historias en `docs/entrega_1`.

## Stack

- Node.js 20+
- Express + TypeScript
- JWT para autenticación
- Zod para validación de requests
- DynamoDB o memoria local para tickets
- S3 o filesystem local para adjuntos
- Worker cron para evaluación de SLA cada 5 minutos
- Reportes operativos y exportación CSV

## Funcionalidad incluida

- Login con usuarios semilla y roles `REQUESTER`, `AGENT`, `SUPERVISOR`, `ADMIN`.
- Creación de tickets con prioridad sugerida por categoría/palabras clave.
- Asignación automática al agente con menor carga del equipo.
- Gestión de estados, reasignación y comentarios públicos/internos.
- Adjuntos con metadata en el ticket y almacenamiento externo configurable.
- Auditoría inmutable en cada ticket.
- Cálculo de SLA por prioridad `P0` a `P4` con horario laboral configurable.
- Worker de escalamiento automático por SLA vencido.
- Reportes de desempeño y cumplimiento de SLA.
- Historial de notificaciones simulado para desarrollo.

## Inicio rápido

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Healthcheck:

```bash
curl http://localhost:8080/health
```

## Usuarios de desarrollo

Todos usan password `demo123`.

| Rol | Email |
| --- | --- |
| Solicitante | `ana@ticketflow.local` |
| Agente | `luis@ticketflow.local` |
| Agente | `maria@ticketflow.local` |
| Supervisor | `sofia@ticketflow.local` |
| Admin | `admin@ticketflow.local` |

## Ejemplo de uso

Login:

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"ana@ticketflow.local","password":"demo123"}'
```

Crear ticket:

```bash
curl -X POST http://localhost:8080/api/v1/tickets \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"Error 500 al procesar pago","description":"El sistema muestra error cuando intento pagar.","category":"pagos"}'
```

Listar tickets:

```bash
curl http://localhost:8080/api/v1/tickets \
  -H "authorization: Bearer $TOKEN"
```

## Configuración AWS

Para usar DynamoDB y S3:

```env
DATA_STORE=dynamodb
ATTACHMENT_STORE=s3
AWS_REGION=us-west-2
DYNAMODB_TICKETS_TABLE=pdds-2-quarter-project-group-6-dev-tickets
S3_ATTACHMENTS_BUCKET=<bucket-de-infra>
```

La tabla esperada usa `TicketID` como llave primaria, `AgentID` como atributo indexado y `TimeToExist` para TTL, consistente con la infraestructura existente.

## Scripts

```bash
npm run dev      # desarrollo con tsx watch
npm run build    # compila TypeScript
npm start        # ejecuta dist/main.js
npm test         # pruebas de integración
npm run lint     # typecheck sin emitir archivos
```


## Postman

La coleccion y environments estan en `postman/`:

- `postman/ticketflow.postman_collection.json`
- `postman/environments/ticketflow-local.postman_environment.json`
- `postman/environments/ticketflow-dev.postman_environment.json`
- `postman/environments/ticketflow-prod.postman_environment.json`

El login guarda automaticamente `authToken` en el environment activo para reutilizarlo en los demas endpoints.

## Endpoints

Base URL local:

```text
http://localhost:8080
```

La API versionada vive bajo:

```text
/api/v1
```

Excepto `GET /health`, todos los endpoints de negocio requieren header:

```http
Authorization: Bearer <token>
```

### Resumen de permisos

| Rol | Puede hacer |
| --- | --- |
| `REQUESTER` | Crear tickets, ver sus propios tickets, agregar comentarios publicos, subir/ver adjuntos de sus tickets. |
| `AGENT` | Ver tickets de su equipo, actualizar tickets asignados, agregar comentarios publicos/internos, subir adjuntos. |
| `SUPERVISOR` | Ver y gestionar tickets, reasignar, consultar reportes y notificaciones. |
| `ADMIN` | Acceso administrativo amplio a tickets, reportes y notificaciones. |

### `GET /health`

Verifica que la aplicacion esta levantada.

- Auth: no requiere token.
- Uso: healthcheck local, monitoreo o balanceador.

Respuesta ejemplo:

```json
{
  "status": "ok",
  "service": "ticketflow-backend",
  "timestamp": "2026-05-31T12:00:00.000Z"
}
```

### `POST /api/v1/auth/login`

Autentica un usuario demo y devuelve un JWT.

- Auth: no requiere token.
- Body: `email`, `password`.
- Postman: guarda automaticamente `authToken`, `currentUserId`, `currentUserRole` y `currentUserEmail`.

Body ejemplo:

```json
{
  "email": "ana@ticketflow.local",
  "password": "demo123"
}
```

Respuesta relevante:

```json
{
  "token": "jwt...",
  "user": {
    "id": "USR-1001",
    "email": "ana@ticketflow.local",
    "role": "REQUESTER"
  }
}
```

### `POST /api/v1/tickets`

Crea un ticket de soporte.

- Auth: requiere token.
- Roles: `REQUESTER`, `AGENT`, `SUPERVISOR`, `ADMIN`.
- Formato: JSON o multipart si se envian adjuntos.
- Logica: calcula prioridad sugerida, SLA y asigna automaticamente al agente con menor carga.
- Postman: guarda automaticamente `ticketId` y `assignedAgentId`.

Body JSON ejemplo:

```json
{
  "title": "Error 500 al procesar pago",
  "description": "El sistema muestra error 500 cuando intento completar un pago.",
  "category": "pagos"
}
```

Campos opcionales:

```json
{
  "priority": "P1",
  "assignedAgentId": "AGE-2001",
  "teamId": "support-core"
}
```

Respuesta relevante:

```json
{
  "data": {
    "id": "TKT-2026-abcd1234",
    "priority": "P1",
    "suggestedPriority": "P1",
    "status": "ASSIGNED",
    "assignedAgentId": "AGE-2001",
    "sla": {
      "responseDueAt": "...",
      "resolutionDueAt": "...",
      "isAtRisk": false,
      "isBreached": false
    }
  }
}
```

### `GET /api/v1/tickets`

Lista tickets visibles para el usuario autenticado.

- Auth: requiere token.
- Roles: todos.
- `REQUESTER`: solo ve sus tickets.
- `AGENT`: ve tickets de su equipo.
- `SUPERVISOR` y `ADMIN`: pueden consultar mas ampliamente.

Query params soportados:

| Param | Descripcion |
| --- | --- |
| `requesterId` | Filtra por solicitante. |
| `assignedAgentId` | Filtra por agente asignado. |
| `teamId` | Filtra por equipo. |
| `priority` | `P0`, `P1`, `P2`, `P3`, `P4`. |
| `status` | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED`. |
| `category` | Filtra por categoria exacta. |
| `slaAtRisk` | `true` o `false`. |
| `includeClosed` | Incluye tickets resueltos/cerrados/cancelados. |
| `from` | Fecha ISO inicial por `createdAt`. |
| `to` | Fecha ISO final por `createdAt`. |

Ejemplo:

```text
GET /api/v1/tickets?priority=P1&includeClosed=true
```

### `GET /api/v1/tickets/:ticketId`

Obtiene el detalle de un ticket.

- Auth: requiere token.
- Roles: todos, respetando permisos de visibilidad.
- `REQUESTER`: no ve comentarios internos y recibe auditoria limitada.
- Soporte/admin: ve comentarios internos y auditoria completa.

Variables Postman:

- Usa `{{ticketId}}`.

### `PATCH /api/v1/tickets/:ticketId/status`

Cambia el estado de un ticket.

- Auth: requiere token.
- Roles: `AGENT`, `SUPERVISOR`, `ADMIN`.
- Restriccion: un `AGENT` solo puede modificar tickets asignados a el.
- Efectos: actualiza `updatedAt`, registra auditoria, marca primera respuesta, marca resolucion si aplica y genera notificacion simulada.

Body ejemplo:

```json
{
  "status": "IN_PROGRESS",
  "reason": "El agente inicio la revision del incidente."
}
```

Estados validos:

```text
OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED
```

### `PATCH /api/v1/tickets/:ticketId/assignment`

Reasigna un ticket a otro agente.

- Auth: requiere token.
- Roles: `AGENT`, `SUPERVISOR`, `ADMIN`.
- Restriccion: `assignedAgentId` debe pertenecer a un usuario con rol `AGENT`.
- Efectos: registra auditoria de asignacion/reasignacion.

Body ejemplo:

```json
{
  "assignedAgentId": "AGE-2002",
  "reason": "Redistribucion manual de carga."
}
```

### `POST /api/v1/tickets/:ticketId/comments`

Agrega un comentario al ticket.

- Auth: requiere token.
- Roles: todos.
- `REQUESTER`: solo puede crear comentarios `PUBLIC`.
- `AGENT`, `SUPERVISOR`, `ADMIN`: pueden crear comentarios `PUBLIC` o `INTERNAL`.
- Efectos: registra auditoria y puede marcar primera respuesta si comenta soporte.

Comentario publico:

```json
{
  "content": "Estamos revisando el incidente.",
  "visibility": "PUBLIC"
}
```

Comentario interno:

```json
{
  "content": "Nota interna: revisar logs del gateway de pagos.",
  "visibility": "INTERNAL"
}
```

### `POST /api/v1/tickets/:ticketId/attachments`

Sube uno o varios adjuntos al ticket.

- Auth: requiere token.
- Roles: todos con acceso al ticket.
- Formato: `multipart/form-data`.
- Campo de archivo: `attachments`.
- Limite actual: hasta 5 archivos, 10 MB por archivo.
- Storage local: guarda archivos en `backend/uploads/`.
- Storage S3: guarda objetos en el bucket configurado.
- Postman: guarda automaticamente `attachmentId` del ultimo adjunto.

### `GET /api/v1/tickets/:ticketId/attachments/:attachmentId/url`

Devuelve una URL para acceder al adjunto.

- Auth: requiere token.
- Roles: todos con acceso al ticket.
- Modo local: devuelve una ruta local de referencia.
- Modo S3: devuelve una URL prefirmada con expiracion.

Respuesta ejemplo:

```json
{
  "data": {
    "url": "https://..."
  }
}
```

### `GET /api/v1/tickets/:ticketId/attachments/:attachmentId/download`

Descarga el adjunto pasando por la API autenticada.

- Auth: requiere token.
- Roles: todos con acceso al ticket.
- Uso recomendado en local porque valida permisos antes de entregar el archivo.

### `GET /api/v1/reports/performance`

Genera un reporte operativo en JSON.

- Auth: requiere token.
- Roles: `SUPERVISOR`, `ADMIN`.
- Incluye: total de tickets, abiertos, resueltos, tiempo promedio de resolucion, cumplimiento SLA, tickets por agente, categoria y prioridad.

Query params opcionales:

| Param | Descripcion |
| --- | --- |
| `from` | Fecha ISO inicial. |
| `to` | Fecha ISO final. |

Respuesta relevante:

```json
{
  "data": {
    "totalTickets": 10,
    "openTickets": 4,
    "resolvedTickets": 6,
    "averageResolutionMinutes": 120,
    "slaComplianceRate": 0.8333,
    "ticketsByAgent": [],
    "ticketsByCategory": [],
    "ticketsByPriority": []
  }
}
```

### `GET /api/v1/reports/performance.csv`

Genera el mismo reporte de performance en CSV.

- Auth: requiere token.
- Roles: `SUPERVISOR`, `ADMIN`.
- Uso: descarga/exportacion para analisis externo.

### `GET /api/v1/notifications`

Lista el historial de notificaciones simuladas.

- Auth: requiere token.
- Roles: `SUPERVISOR`, `ADMIN`.
- Las notificaciones actuales son simuladas en memoria para desarrollo.

Query params:

| Param | Descripcion |
| --- | --- |
| `ticketId` | Opcional. Filtra notificaciones de un ticket. |

Ejemplo:

```text
GET /api/v1/notifications?ticketId=TKT-2026-abcd1234
```

## Persistencia actual

Por defecto, el backend usa:

```env
DATA_STORE=local-memory
ATTACHMENT_STORE=local
```

Esto implica:

| Dato | Donde se guarda por defecto |
| --- | --- |
| Tickets | Memoria RAM del proceso Node.js. |
| Comentarios | Memoria RAM del proceso Node.js. |
| Auditoria | Memoria RAM del proceso Node.js. |
| SLA | Memoria RAM del proceso Node.js. |
| Notificaciones | Memoria RAM del proceso Node.js. |
| Adjuntos | `backend/uploads/`. |

Si reinicias la app, los datos en memoria se pierden. Para persistencia real usa `DATA_STORE=dynamodb` y `ATTACHMENT_STORE=s3`.
