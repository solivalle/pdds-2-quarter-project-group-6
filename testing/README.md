# Entrega de pruebas de interfaz grafica - TicketFlow

Este directorio contiene la entrega de pruebas automaticas de interfaz grafica solicitada para TicketFlow.

## Contenido

| Ruta | Descripcion |
| --- | --- |
| `docs/pruebas_interfaz_playwright.md` | Documento principal de la entrega: herramienta, instalacion, ejecucion, escenarios, resultados y evidencia. |
| `automation/ticketflow.spec.ts` | Copia del codigo Playwright con los 10 escenarios automatizados. |
| `automation/playwright.config.ts` | Copia de la configuracion usada para ejecutar las pruebas. |
| `automation/frontend-package.json` | Scripts y dependencias relevantes del frontend para ejecutar Playwright. |
| `evidence/playwright-report/index.html` | Reporte HTML generado por Playwright. |
| `evidence/screenshots/reporte-chromium.png` | Captura del reporte con escenarios aprobados en Chromium desktop. |
| `evidence/screenshots/reporte-mobile-chrome.png` | Captura del reporte con escenarios aprobados en Chromium mobile. |

## Resultado

```text
20 passed
```

Se automatizaron 10 escenarios funcionales. La suite se ejecuta en 2 proyectos de Playwright:

- `chromium`
- `mobile-chrome`

Por eso el reporte muestra 20 ejecuciones aprobadas.

## Comandos principales

Desde la raiz del repositorio:

```bash
npm install --prefix frontend
npm --prefix frontend exec playwright install chromium
npm --prefix frontend run test:e2e
```

Para abrir el reporte:

```bash
npm --prefix frontend run test:e2e:report
```

Tambien puede abrirse directamente:

```text
testing/evidence/playwright-report/index.html
```

