# Plan de Pruebas – TicketFlow
---

**Universidad Galileo**  
Postgrado en Diseño y Desarrollo de Software  
Testing para Software · Ciclo Mayo–Junio 2026

**Equipo 6**  
- Francisco Magdiel Asicona Mateo — 26006399  
- Sergio Geovany García Smith — 25008130  
- Sergio Rolando Oliva del Valle — 26005694

**Fecha de entrega:** viernes 29 de mayo de 2026  
**Versión del documento:** 1.0

---
## Sistema de Gestión de Incidentes

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Objetivos de las pruebas](#2-objetivos-de-las-pruebas)
3. [Alcance de las pruebas](#3-alcance-de-las-pruebas)
4. [Estrategia de pruebas](#4-estrategia-de-pruebas)
5. [Cronograma de las pruebas](#5-cronograma-de-las-pruebas)
6. [Tipos de preubas](#6-tipos-de-pruebas)
7. [Técnicas de diseño de pruebas](#7-técnicas-de-diseño-de-pruebas)
8. [Entornos de prueba](#8-entornos-de-prueba)
9. [Riesgos identificados](#9-riesgos-identificados)
10. [Criterios de aceptación](#10-criterios-de-aceptación)
11. [Escenarios de prueba](#11-escenarios-de-prueba)
12. [Herramientas utilizadas](#12-herramientas-utilizadas)
13. [Entregables](#13-entregables)


# 1. Introducción

El presente documento define el plan de pruebas para TicketFlow, una plataforma de gestión de incidentes desarrollada sobre infraestructura AWS utilizando NodeJS, DynamoDB y procesamiento asíncrono mediante colas.

El objetivo de este plan es establecer una estrategia clara para validar el funcionamiento del sistema, garantizando estabilidad, integridad de datos y correcto comportamiento de los módulos principales.

Las pruebas se enfocan principalmente en:

* pruebas unitarias,
* pruebas funcionales,
* pruebas de integración.

---

# 2. Objetivos de las pruebas

Las pruebas tienen como objetivo validar que el sistema:

* Permita registrar incidentes correctamente.
* Procese incidentes críticos de forma automática.
* Mantenga integridad de datos en DynamoDB.
* Maneje errores de forma controlada.
* Permita comunicación correcta entre API, base de datos y colas.
* Mantenga estabilidad durante operaciones concurrentes básicas.
* Responda correctamente ante entradas válidas e inválidas.

---

# 3. Alcance de las pruebas

## Componentes incluidos

Las pruebas cubrirán:

* API REST desarrollada en NodeJS.
* Persistencia de datos en DynamoDB.
* Integración con sistema de colas.
* Lógica de escalamiento de incidentes.
* Validaciones de backend.
* Manejo de errores.
* Procesamiento de estados de incidentes.


## Componentes no incluidos

No forman parte de este plan:

* Pruebas móviles
* Pruebas avanzadas de UX/UI
* Pruebas de penetración completas
* Pruebas avanzadas de infraestructura
* Pruebas multi-región

---

# 4. Estrategia de pruebas

La estrategia se divide en tres niveles principales:

| Nivel de prueba        | Objetivo                              |
| ---------------------- | ------------------------------------- |
| Pruebas Unitarias      | Validar funciones individuales        |
| Pruebas de Integración | Validar interacción entre componentes |
| Pruebas Funcionales    | Validar flujos completos del sistema  |

---

# 5. Cronograma de las pruebas

## Enfoque
Este cronograma cubre principalmente:

* Pruebas unitarias
* Pruebas de integración
* Pruebas funcionales


| Fase | Actividad | Tipo de prueba | Resultado esperado |
|---|---|---|---|
| Fase 1 | Validar funciones base del backend: creación de incidentes, validaciones y manejo de errores | Unitarias | Funciones principales probadas correctamente |
| Fase 2 | Validar endpoints principales de la API: creación, consulta y actualización de incidentes | Funcionales | API responde correctamente a flujos básicos |
| Fase 3 | Validar comunicación entre API, DynamoDB y entorno AWS | Integración | Persistencia correcta y comunicación estable |
| Fase 4 | Validar envío de mensajes a cola y procesamiento inicial de incidentes críticos | Integración | Mensajes procesados correctamente |
| Fase 5 | Validar escalamiento automático, cambios de estado y auditoría | Funcionales / Integración | Escalamiento y estados funcionando correctamente |
| Fase 6 | Ejecutar regresión básica de pruebas unitarias, funcionales e integración | Unitarias / Funcionales / Integración | Sin errores críticos antes de entrega final |
| Fase 7 | Consolidar evidencias, resultados y hallazgos de pruebas | Documentación QA | Evidencias organizadas para entrega |
| Fase 8 | Revisión final del plan de pruebas y escenarios | Validación final | Documento listo para presentación |
| Fase 9 | Presentar estrategia de pruebas y resultados obtenidos | Presentación | Explicación clara del proceso QA |

---


# 6. Tipos de pruebas

# 6.1 Pruebas Unitarias

Las pruebas unitarias validan funciones internas del backend desarrollado en NodeJS.

## Objetivos

* Validar lógica de negocio.
* Validar manejo de errores.
* Verificar validaciones de datos.
* Detectar fallos tempranos en funciones individuales.

## Herramientas

* Jest
* Supertest

## Componentes principales

* createIncident()
* validateIncident()
* escalationService()
* queuePublisher()



# 6.2 Pruebas de Integración

Las pruebas de integración validan la comunicación entre los componentes principales del sistema.

## Integraciones a validar

* API REST ↔ DynamoDB
* API REST ↔ Sistema de colas
* Servicio de escalamiento ↔ Base de datos

## Objetivos

* Validar persistencia correcta.
* Validar procesamiento de mensajes.
* Verificar sincronización de estados.
* Detectar errores de comunicación entre servicios.


# 6.3 Pruebas Funcionales

Las pruebas funcionales validan el comportamiento completo del sistema desde la perspectiva del usuario.

## Flujos principales

* Registro de incidentes.
* Consulta de incidentes.
* Escalamiento automático.
* Validación de errores.
* Actualización de estados.

## Herramientas

* Postman
* Newman

---

# 7. Técnicas de diseño de pruebas

# 7.1 Equivalence Partitioning

Se utilizará para dividir entradas válidas e inválidas en grupos equivalentes.

## Ejemplo

Prioridades válidas:

* Baja
* Media
* Alta
* Crítica

Prioridades inválidas:

* Vacío
* Null
* Texto inválido


# 7.2 Boundary Value Analysis

Se utilizará para validar límites de entrada.

## Ejemplo

Cantidad máxima de caracteres:

* 0 caracteres
* 1 carácter
* límite permitido
* límite excedido


# 7.3 Error Guessing

Se utilizará experiencia previa para detectar errores comunes.

## Casos típicos

* JSON mal formado
* Campos faltantes
* IDs inválidos
* Timeouts
* Conexión perdida con DynamoDB

# 7.4 State Transition Testing

Se utilizará para validar cambios de estado de los incidentes.

## Flujo esperado

```text
Nuevo → En Proceso → Escalado → Cerrado
```

---

# 7.5 Decision Table Testing

Se utilizará para validar reglas de negocio relacionadas con prioridad y escalamiento.

| Prioridad | Tiempo excedido | Resultado  |
| --------- | --------------- | ---------- |
| Alta      | Sí              | Escalar    |
| Alta      | No              | Mantener   |
| Baja      | Sí              | Notificar  |
| Baja      | No              | Sin acción |

---

# 8. Entornos de prueba

| Entorno        | Descripción                   |
| -------------- | ----------------------------- |
| Local          | Desarrollo individual         |
| Docker Local   | Simulación local de servicios |
| AWS Dev        | Ambiente principal de pruebas |
| DynamoDB Local | Persistencia local            |
| Queue Mock     | Simulación de colas           |

---

# 9. Riesgos identificados

| Riesgo                      | Impacto |
| --------------------------- | ------- |
| Caída de DynamoDB           | Alto    |
| Pérdida de mensajes en cola | Alto    |
| Saturación de API           | Medio   |
| Vulnerabilidades npm        | Alto    |
| Fallos de conectividad AWS  | Alto    |

---

# 10. Criterios de aceptación

El sistema será considerado estable si:

* Las pruebas unitarias alcanzan una cobertura mínima del 80%.
* Las pruebas funcionales críticas son exitosas.
* No existen errores HTTP 500 recurrentes.
* Los incidentes se almacenan correctamente.
* El sistema de escalamiento funciona correctamente.
* No existen vulnerabilidades críticas en dependencias.

---

# 11. Escenarios de prueba


# Escenario 1 – Registro exitoso de incidente crítico

## Tipo

Prueba funcional

## Técnica aplicada

Equivalence Partitioning

## Objetivo

Validar el registro correcto de un incidente crítico.

## Precondiciones

* API disponible.
* DynamoDB operativo.
* Cola habilitada.

## Pasos

1. Enviar POST `/incidents`
2. Ingresar datos válidos.
3. Validar respuesta.

## Resultado esperado

* HTTP 201 Created.
* Incidente almacenado en DynamoDB.
* Mensaje enviado correctamente a la cola.

---

# Escenario 2 – Validación de campos obligatorios

## Tipo

Prueba funcional

## Técnica aplicada

Boundary Value Analysis

## Objetivo

Validar rechazo de solicitudes incompletas.

## Precondiciones

* API activa.
* Endpoint accesible.

## Pasos

1. Enviar POST `/incidents`
2. Omitir el campo prioridad.
3. Revisar respuesta.

## Resultado esperado

* HTTP 400 Bad Request.
* Mensaje descriptivo del error.
* No se almacena el incidente.

---

# Escenario 3 – Escalamiento automático de incidente crítico

## Tipo

Prueba de integración

## Técnica aplicada

Decision Table Testing

## Objetivo

Validar reglas de escalamiento automático.

## Precondiciones

* Servicio de colas activo.
* Reglas de escalamiento habilitadas.
* DynamoDB operativo.

## Pasos

1. Crear incidente crítico.
2. Esperar procesamiento.
3. Consultar estado del incidente.

## Resultado esperado

* Estado actualizado a “Escalado”.
* Evento generado correctamente.
* Registro almacenado en auditoría.

---

# Escenario 4 – Validación unitaria de createIncident()

## Tipo

Prueba unitaria

## Técnica aplicada

Error Guessing

## Objetivo

Validar comportamiento interno de la función createIncident().

## Precondiciones

* Proyecto NodeJS configurado.
* Jest instalado.

## Pasos

1. Ejecutar prueba unitaria.
2. Simular entrada válida.
3. Revisar resultado.

## Resultado esperado

* Retorno correcto de objeto.
* Atributos válidos.
* Sin excepciones inesperadas.

---

# Escenario 5 – Validación de datos inválidos en createIncident()

## Tipo

Prueba unitaria

## Técnica aplicada

Error Guessing

## Objetivo

Validar manejo de entradas inválidas.

## Precondiciones

* Entorno NodeJS operativo.
* Validaciones implementadas.

## Pasos

1. Ejecutar prueba.
2. Enviar objeto vacío.
3. Revisar excepción generada.

## Resultado esperado

* Excepción controlada.
* Mensaje descriptivo.
* Sin fallo inesperado.

---

# Escenario 6 – Persistencia correcta en DynamoDB

## Tipo

Prueba de integración

## Técnica aplicada

Equivalence Partitioning

## Objetivo

Validar almacenamiento correcto de incidentes.

## Precondiciones

* DynamoDB activo.
* API conectada correctamente.

## Pasos

1. Crear incidente.
2. Consultar registro en DynamoDB.
3. Comparar datos almacenados.

## Resultado esperado

* Persistencia correcta.
* Datos íntegros.
* Sin inconsistencias.

---

# Escenario 7 – Procesamiento correcto de mensajes en cola

## Tipo

Prueba de integración

## Técnica aplicada

State Transition Testing

## Objetivo

Validar el flujo de procesamiento de mensajes.

## Precondiciones

* Cola habilitada.
* Consumidores activos.

## Pasos

1. Crear incidente crítico.
2. Monitorear cola.
3. Revisar estado final.

## Resultado esperado

* Mensaje procesado correctamente.
* Estado actualizado.
* Sin pérdida de mensajes.

---

# Escenario 8 – Cambio de estados del incidente

## Tipo

Prueba funcional

## Técnica aplicada

State Transition Testing

## Objetivo

Validar transiciones válidas de estado.

## Flujo esperado

```text
Nuevo → En Proceso → Escalado → Cerrado
```

## Pasos

1. Crear incidente.
2. Cambiar estados secuencialmente.
3. Validar restricciones.

## Resultado esperado

* Transiciones válidas aceptadas.
* Estados inválidos rechazados.

---

# 12. Herramientas utilizadas

| Herramienta    | Uso                |
| -------------- | ------------------ |
| NodeJS         | Backend            |
| Jest           | Unit testing       |
| Supertest      | Testing API        |
| Postman        | Functional testing |
| Newman         | Automatización     |
| DynamoDB Local | Persistencia local |
| Docker         | Simulación local   |
| AWS EC2        | Ambiente cloud     |
| LocalStack     | Simulación AWS     |

---

# 13. Entregables

* Reporte de pruebas unitarias.
* Evidencia de pruebas funcionales.
* Evidencia de pruebas de integración.
* Scripts Postman.
* Logs de ejecución.
* Capturas de resultados.
* Documento final de resultados.


# URL Repositorio

[https://github.com/solivalle/pdds-2-quarter-project-group-6](https://github.com/solivalle/pdds-2-quarter-project-group-6)


