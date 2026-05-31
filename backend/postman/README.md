# Postman - TicketFlow Backend

## Archivos

- `ticketflow.postman_collection.json`: coleccion principal de endpoints.
- `environments/ticketflow-local.postman_environment.json`: environment local listo para `http://localhost:8080`.
- `environments/ticketflow-dev.postman_environment.json`: environment dev con placeholder de host.
- `environments/ticketflow-prod.postman_environment.json`: environment prod con placeholder de dominio.

## Como importar

1. Abre Postman.
2. Importa `ticketflow.postman_collection.json`.
3. Importa el environment que vas a usar, por ejemplo `ticketflow-local.postman_environment.json`.
4. Selecciona el environment en la esquina superior derecha.
5. Ejecuta uno de los requests de `Auth`.

## Autenticacion automatica

Cada request de login tiene un script en la pestana `Tests` que guarda estas variables en el environment activo:

- `authToken`
- `currentUserId`
- `currentUserRole`
- `currentUserEmail`

La coleccion usa `Bearer {{authToken}}` a nivel global, por lo que los demas endpoints reutilizan automaticamente el token guardado.

## Flujo recomendado local

1. Ejecuta `Health / Healthcheck`.
2. Ejecuta `Auth / Login - Solicitante`.
3. Ejecuta `Tickets / Crear ticket`; esto guarda `ticketId` automaticamente.
4. Ejecuta `Auth / Login - Agente`.
5. Ejecuta `Comentarios / Agregar comentario interno` o `Tickets / Cambiar estado a IN_PROGRESS`.
6. Ejecuta `Auth / Login - Supervisor`.
7. Ejecuta `Reportes / Reporte de performance` o `Notificaciones / Historial de notificaciones`.

## Usuarios locales

Todos usan password `demo123`.

| Rol | Email |
| --- | --- |
| Solicitante | `ana@ticketflow.local` |
| Agente | `luis@ticketflow.local` |
| Agente | `maria@ticketflow.local` |
| Supervisor | `sofia@ticketflow.local` |
| Admin | `admin@ticketflow.local` |
