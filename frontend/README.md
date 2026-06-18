# TicketFlow Frontend

SPA React + TypeScript + Vite para consumir el backend Express existente.

## Desarrollo local

```bash
npm install
npm run dev
```

El servidor Vite corre en `http://localhost:5173` y proxy hacia el backend en `http://localhost:8080`.

## Build para un solo servidor

Desde la raiz del repo:

```bash
npm run build
```

Ese comando genera:

- `frontend/dist`: assets estaticos del frontend.
- `backend/dist`: backend compilado.

Terraform empaqueta `frontend/dist` como `public/` dentro del zip de la aplicacion. En EC2, Express sirve esos archivos desde `FRONTEND_DIST_DIR=./public` y mantiene la API bajo `/api/v1`.

## Pruebas E2E

```bash
npm --prefix frontend exec playwright install chromium
npm run test:e2e
```

El runner levanta el backend con el frontend compilado y ejecuta los flujos en Chromium desktop y mobile.
