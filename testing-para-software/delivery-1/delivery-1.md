# Plan de Pruebas – Sistema de Gestión de Incidentes

## 1. Objetivos de las pruebas

El objetivo principal de las pruebas es validar que el sistema de gestión de incidentes funcione correctamente bajo diferentes escenarios operativos, garantizando:

- Correcto registro y escalamiento de incidentes.
- Integridad y persistencia de los datos en DynamoDB.
- Correcta comunicación entre los componentes NodeJS, DynamoDB y sistema de colas.
- Estabilidad del sistema bajo carga.
- Capacidad de recuperación ante fallos.
- Seguridad básica del código y dependencias.
- Correcto comportamiento tanto en escenarios exitosos como en escenarios de error.

---

# 2. Alcance de las pruebas

Las pruebas cubrirán:

- API REST desarrollada en NodeJS.
- Persistencia de incidentes en DynamoDB.
- Procesamiento asíncrono mediante colas.
- Lógica de escalamiento de incidentes.
- Validaciones de entradas y salidas.
- Manejo de errores.
- Rendimiento básico del sistema.
- Resiliencia ante desconexión de servicios.

No se incluyen pruebas móviles ni pruebas de UI avanzadas.

---

# 3. Cronograma de las pruebas

| Fase | Actividad | Duración |
|---|---|---|
| Fase 1 | Preparación del entorno | 1 día |
| Fase 2 | Desarrollo de pruebas unitarias | 2 días |
| Fase 3 | Ejecución de pruebas funcionales | 2 días |
| Fase 4 | Ejecución de pruebas de carga | 1 día |
| Fase 5 | Ejecución de pruebas de seguridad | 1 día |
| Fase 6 | Ejecución de pruebas de resiliencia | 1 día |
| Fase 7 | Documentación de resultados | 1 día |

---

# 4. Tipos de pruebas

## 4.1 Pruebas Unitarias

Pruebas enfocadas en validar funciones individuales del código NodeJS.

Herramientas sugeridas:
- Jest
- Mocha
- Chai

---

## 4.2 Pruebas Funcionales

Pruebas enfocadas en validar flujos completos del sistema.

Herramientas sugeridas:
- Postman
- Newman
- Supertest

---

## 4.3 Pruebas de Carga

Pruebas orientadas a validar comportamiento bajo alto tráfico.

Herramientas sugeridas:
- k6
- Artillery
- Apache JMeter

---

## 4.4 Pruebas de Seguridad

Pruebas orientadas a detectar vulnerabilidades y malas prácticas.

Herramientas sugeridas:
- SonarQube
- npm audit
- Snyk

---

## 4.5 Pruebas de Resiliencia

Pruebas orientadas a validar recuperación ante fallos de infraestructura.

Herramientas sugeridas:
- Docker Compose
- AWS Console
- Scripts manuales

---

# 5. Entornos de pruebas

| Entorno | Descripción |
|---|---|
| Local | Ejecución desde la máquina del desarrollador |
| AWS Dev | Instancia EC2 con acceso a DynamoDB y colas |
| Docker Local | Simulación de servicios locales |
| DynamoDB Local | Base de datos local para pruebas |
| Queue Mock | Simulación de colas usando LocalStack o RabbitMQ |

---

# 6. Riesgos

| Riesgo | Impacto |
|---|---|
| Fallos de conectividad con AWS | Alto |
| Datos inconsistentes en DynamoDB | Alto |
| Saturación de la cola de mensajes | Medio |
| Fugas de memoria en NodeJS | Alto |
| Vulnerabilidades en dependencias npm | Alto |
| Tiempo de respuesta elevado bajo carga | Medio |
| Fallo total de la base de datos | Alto |

---

# 7. Criterios de aceptación

## Entradas válidas

- Los incidentes deben contener:
  - título
  - descripción
  - prioridad
  - timestamp
  - usuario creador

- Los datos deben cumplir validaciones de formato.

---

## Salidas esperadas

- Respuestas HTTP correctas.
- Persistencia correcta en DynamoDB.
- Escalamiento exitoso del incidente.
- Registro correcto en logs.
- Manejo adecuado de errores.
- No pérdida de mensajes en colas.

---

# 8. Entregables

- Reporte de pruebas unitarias.
- Reporte de pruebas funcionales.
- Evidencia de pruebas de carga.
- Reporte de SonarQube.
- Logs de resiliencia.
- Capturas de resultados.
- Scripts de pruebas.
- Documento final de resultados.

---

# 9. Casos de prueba

---

# Prueba 1 – Registro exitoso de un incidente crítico

## Tipo
Prueba funcional

## Objetivo
Validar que un incidente pueda registrarse correctamente en el sistema y almacenarse en DynamoDB.

## Pre-condiciones
- La API NodeJS debe estar en ejecución.
- DynamoDB debe estar disponible.
- El sistema de colas debe estar activo.
- El endpoint `/incidents` debe estar accesible.
- Debe existir conectividad entre EC2 y DynamoDB.

## Pasos
1. Enviar petición POST `/incidents`
2. Enviar datos válidos:
- título
- descripción
- prioridad crítica
3. Validar respuesta HTTP.

## Resultado esperado
- HTTP 201 Created.
- Incidente almacenado en DynamoDB.
- Mensaje enviado correctamente a la cola.
- Registro generado en logs.

---

# Prueba 2 – Validación de error por campos obligatorios faltantes

## Tipo
Prueba funcional

## Objetivo
Validar que el sistema rechace solicitudes incompletas.

## Pre-condiciones
- La API debe estar funcionando.
- El endpoint `/incidents` debe estar disponible.
- Debe existir validación activa en backend.

## Pasos
1. Enviar POST `/incidents`
2. Omitir el campo prioridad.
3. Revisar respuesta.

## Resultado esperado
- HTTP 400 Bad Request.
- Mensaje indicando el campo faltante.
- El incidente no debe almacenarse.
- No debe enviarse ningún mensaje a la cola.

---

# Prueba 3 – Escalamiento automático de incidentes de alta prioridad

## Tipo
Prueba funcional

## Objetivo
Validar que los incidentes críticos sean escalados automáticamente.

## Pre-condiciones
- Sistema de colas activo.
- Servicio de procesamiento de incidentes habilitado.
- DynamoDB operativo.
- Configuración de reglas de escalamiento activa.

## Pasos
1. Crear incidente con prioridad crítica.
2. Esperar procesamiento del mensaje.
3. Consultar estado del incidente.

## Resultado esperado
- El incidente cambia a estado “Escalado”.
- Se genera evento de notificación.
- Se registra auditoría del escalamiento.

---

# Prueba 4 – Validación unitaria de la función createIncident()

## Tipo
Prueba unitaria

## Objetivo
Validar el correcto funcionamiento interno de la función encargada de crear incidentes.

## Pre-condiciones
- Proyecto NodeJS instalado localmente.
- Dependencias npm instaladas.
- Framework Jest configurado.
- Archivo de pruebas disponible.

## Pasos
1. Ejecutar suite de pruebas Jest.
2. Simular entrada válida.
3. Revisar resultado retornado.

## Resultado esperado
- La función retorna objeto válido.
- Los atributos son correctos.
- No se generan excepciones.

---

# Prueba 5 – Validación unitaria de manejo de datos inválidos

## Tipo
Prueba unitaria

## Objetivo
Validar que la función maneje correctamente entradas inválidas.

## Pre-condiciones
- Entorno NodeJS configurado.
- Jest instalado.
- Validaciones implementadas en el backend.

## Pasos
1. Ejecutar prueba unitaria.
2. Enviar objeto vacío a `createIncident()`.
3. Capturar respuesta.

## Resultado esperado
- Se lanza excepción controlada.
- Se devuelve mensaje descriptivo.
- No ocurre fallo inesperado.

---

# Prueba 6 – Simulación de tráfico concurrente elevado sobre la API

## Tipo
Prueba de carga

## Objetivo
Validar estabilidad del sistema bajo múltiples solicitudes concurrentes.

## Pre-condiciones
- API desplegada y accesible.
- DynamoDB operativo.
- Herramienta k6 instalada localmente.
- Sistema de colas activo.

## Pasos
1. Ejecutar script k6.
2. Generar 500 requests concurrentes.
3. Monitorear métricas de respuesta.

## Resultado esperado
- La API permanece disponible.
- Tiempo promedio menor a 2 segundos.
- No existen errores masivos HTTP 500.

---

# Prueba 7 – Validación de procesamiento masivo en cola de mensajes

## Tipo
Prueba de carga

## Objetivo
Validar que el sistema procese correctamente múltiples incidentes simultáneamente.

## Pre-condiciones
- Sistema de colas habilitado.
- Consumidores de mensajes activos.
- DynamoDB operativo.
- Logs habilitados.

## Pasos
1. Crear múltiples incidentes simultáneamente.
2. Monitorear consumo de mensajes.
3. Revisar estado final de incidentes.

## Resultado esperado
- Todos los mensajes son procesados.
- No existen pérdidas de mensajes.
- El sistema mantiene estabilidad.

---

# Prueba 8 – Análisis estático de seguridad utilizando SonarQube

## Tipo
Prueba de seguridad

## Objetivo
Identificar vulnerabilidades y problemas de calidad en el código fuente.

## Pre-condiciones
- SonarQube instalado o disponible.
- Proyecto NodeJS compilable.
- Archivo de configuración SonarQube creado.

## Pasos
1. Ejecutar análisis SonarQube.
2. Revisar reporte generado.
3. Analizar vulnerabilidades detectadas.

## Resultado esperado
- No existen vulnerabilidades críticas.
- Cobertura mínima de pruebas del 80%.
- Sin code smells severos.

---

# Prueba 9 – Auditoría de dependencias vulnerables en NodeJS

## Tipo
Prueba de seguridad

## Objetivo
Validar que las dependencias npm no contengan vulnerabilidades críticas.

## Pre-condiciones
- NodeJS instalado.
- Dependencias descargadas.
- Archivo `package.json` actualizado.

## Pasos
1. Ejecutar comando `npm audit`.
2. Revisar resultados.
3. Identificar vulnerabilidades.

## Resultado esperado
- Sin vulnerabilidades críticas.
- Dependencias seguras y actualizadas.
- Reporte limpio o con riesgos mínimos.

---

# Prueba 10 – Validación de comportamiento ante pérdida de conexión con DynamoDB

## Tipo
Prueba de resiliencia

## Objetivo
Validar el comportamiento del sistema cuando la base de datos no está disponible.

## Pre-condiciones
- API en ejecución.
- DynamoDB inicialmente conectado.
- Acceso administrativo al entorno AWS o Docker.

## Pasos
1. Deshabilitar acceso a DynamoDB.
2. Intentar crear incidente.
3. Revisar logs y respuesta API.

## Resultado esperado
- El sistema responde con error controlado.
- La API no colapsa.
- El error queda registrado en logs.

---

# Prueba 11 – Recuperación automática después de restaurar DynamoDB

## Tipo
Prueba de resiliencia

## Objetivo
Validar recuperación del sistema luego de restablecer la conexión a la base de datos.

## Pre-condiciones
- Haber ejecutado previamente la prueba de desconexión.
- DynamoDB restaurado.
- API aún operativa.

## Pasos
1. Restaurar conectividad con DynamoDB.
2. Reintentar creación de incidente.
3. Validar persistencia.

## Resultado esperado
- La API vuelve a responder correctamente.
- Los incidentes se almacenan nuevamente.
- No es necesario reiniciar el sistema.

---

# Prueba 12 – Medición de tiempos de respuesta de la API REST

## Tipo
Prueba funcional

## Objetivo
Validar que la API responda dentro de tiempos aceptables.

## Pre-condiciones
- API NodeJS desplegada.
- DynamoDB operativo.
- Sistema sin carga extrema.
- Herramienta Postman o curl disponible.

## Pasos
1. Ejecutar múltiples requests GET y POST.
2. Medir tiempos de respuesta.
3. Revisar resultados promedio.

## Resultado esperado
- Tiempo promedio menor a 500ms.
- Respuestas consistentes.
- Sin errores HTTP inesperados.

---

# 10. Herramientas recomendadas

| Herramienta | Uso |
|---|---|
| NodeJS | Backend |
| Jest | Unit testing |
| Postman | API testing |
| Newman | Automatización |
| k6 | Load testing |
| SonarQube | Seguridad |
| DynamoDB Local | Base local |
| Docker | Simulación local |
| AWS EC2 | Entorno de despliegue |
| LocalStack | Simulación AWS |

---

