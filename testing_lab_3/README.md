# Laboratorio 3 – Pruebas de Seguridad

**Universidad Galileo**  
Postgrado en Diseño y Desarrollo de Software  

**Curso:** Testing para Software

**Equipo 6**  
- Francisco Magdiel Asicona Mateo — 26006399  
- Sergio Geovany García Smith — 25008130  
- Sergio Rolando Oliva del Valle — 26005694

**Proyecto:** TicketFlow

---

## Descripción

Este directorio contiene el desarrollo del **Laboratorio 3**, enfocado en la aplicación de pruebas de seguridad sobre aplicaciones web y en el análisis estático de código.

Durante el laboratorio se realizaron dos actividades principales:

1. **Pruebas de SQL Injection** utilizando la aplicación vulnerable **DVWA (Damn Vulnerable Web Application)** ejecutada sobre **Metasploitable 2**.
2. **Análisis estático del proyecto TicketFlow** mediante **SonarCloud**, con el objetivo de identificar problemas relacionados con seguridad, confiabilidad y mantenibilidad del código.

---

## Objetivos

* Identificar vulnerabilidades de tipo SQL Injection.
* Comprender el impacto de una validación incorrecta de entradas.
* Analizar la calidad del código mediante herramientas de análisis estático.
* Interpretar los resultados obtenidos y proponer mejoras de seguridad.

---

## Herramientas utilizadas

* VirtualBox 7.1
* Metasploitable 2
* DVWA (Damn Vulnerable Web Application)
* SonarCloud
* GitHub

---

## Estructura del laboratorio

```text
testing_lab_3/
│
├── README.md
├── reports/
│   └── laboratorio3.md
├── evidence/
│   ├── 01-error-apostrofe.png
│   ├── 02-database-union.png
│   ├── 03-consulta-personalizada.png
│   ├── 04-sonarcloud-dashboard.png
│   ├── 05-sonarcloud-security.png
│   ├── 06-sonarcloud-reliability.png
│   └── 07-sonarcloud-maintainability.png
└── resources/
    └── consultas-sql.md
```

---

## Contenido

### `reports/`

Contiene el informe completo del laboratorio, incluyendo el desarrollo de las pruebas realizadas, resultados obtenidos, análisis y conclusiones.

[Reporte Final](/testing_lab_3/reports/laboratorio3.md)

### `evidence/`

Almacena las capturas de pantalla obtenidas durante la ejecución del laboratorio, utilizadas como evidencia de las pruebas realizadas.

### `resources/`

Contiene material de apoyo utilizado durante el desarrollo del laboratorio, como las consultas SQL empleadas durante las pruebas de inyección.

[Consultas SQL](/testing_lab_3/resources/consultas-sql.md)

---

## Resultados obtenidos

Como resultado del laboratorio se logró:

* Comprobar la existencia de vulnerabilidades de SQL Injection en una aplicación deliberadamente vulnerable.
* Obtener información sensible de la base de datos mediante consultas manipuladas.
* Analizar el proyecto TicketFlow utilizando SonarCloud.
* Identificar oportunidades de mejora relacionadas con seguridad, confiabilidad y mantenibilidad del código.

---
