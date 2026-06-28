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

# 1. Introducción

La seguridad del software es un aspecto fundamental durante el desarrollo de cualquier aplicación. Además de verificar que las funcionalidades trabajen correctamente, es importante identificar vulnerabilidades que puedan comprometer la confidencialidad, integridad y disponibilidad de la información.

En este laboratorio se realizaron dos actividades principales. La primera consistió en ejecutar diferentes pruebas de **SQL Injection** sobre la aplicación vulnerable **DVWA (Damn Vulnerable Web Application)** utilizando la máquina virtual **Metasploitable 2**. La segunda actividad consistió en realizar un análisis estático del proyecto **TicketFlow** mediante **SonarCloud**, con el objetivo de identificar posibles problemas de seguridad, confiabilidad y mantenibilidad presentes en el código fuente.

---

# 2. Objetivos

## Objetivo general

Aplicar técnicas básicas de pruebas de seguridad para identificar vulnerabilidades en aplicaciones web y analizar la calidad del código mediante herramientas de análisis estático.

## Objetivos específicos

* Identificar una vulnerabilidad de SQL Injection utilizando DVWA.
* Analizar el impacto de consultas SQL manipuladas.
* Comprender la información que un atacante puede obtener mediante una inyección SQL.
* Realizar un análisis estático del proyecto TicketFlow utilizando SonarCloud.
* Interpretar los resultados obtenidos y proponer recomendaciones de mejora.

---

# 3. Entorno de pruebas

Para el desarrollo del laboratorio se utilizaron las siguientes herramientas.

| Herramienta      | Descripción                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| VirtualBox 7.1   | Plataforma de virtualización utilizada para ejecutar Metasploitable 2.                    |
| Metasploitable 2 | Máquina virtual vulnerable utilizada para realizar pruebas de seguridad.                  |
| DVWA             | Aplicación web vulnerable utilizada para ejecutar ataques de SQL Injection.               |
| SonarCloud       | Plataforma de análisis estático utilizada para evaluar la calidad y seguridad del código. |
| GitHub           | Repositorio del proyecto TicketFlow utilizado para el análisis estático.                  |

---

# 4. Parte 1 – Pruebas de SQL Injection

El objetivo de esta sección fue comprobar cómo una aplicación vulnerable puede ser manipulada mediante consultas SQL maliciosas cuando no valida correctamente las entradas del usuario.

Durante las pruebas se configuró DVWA con el nivel de seguridad **Low**, permitiendo ejecutar diferentes inyecciones SQL sobre el formulario de consulta de usuarios.

## Prueba 1 – Detección de la vulnerabilidad

Se ingresó únicamente el carácter:

```text
'
```

### Resultado

La aplicación devolvió un mensaje de error relacionado con la consulta SQL.

**Evidencia:**

![Query 1](/testing_lab_3/evidence/01-error-apostrofe.PNG)

### Análisis

El error indica que la aplicación construye la consulta SQL concatenando directamente la información ingresada por el usuario. Al introducir un apóstrofe se rompe la sintaxis de la consulta, demostrando que la aplicación no valida correctamente la entrada y es vulnerable a SQL Injection.

---

## Prueba 2 – Obtención del nombre de la base de datos

Se ejecutó la siguiente consulta:

```sql
test' or 1=1 union select null, database() #
```

### Resultado

La aplicación devolvió todos los registros de usuarios y agregó una fila adicional con el valor **dvwa**, correspondiente al nombre de la base de datos utilizada por la aplicación.

**Evidencia:**

![Query 2](/testing_lab_3/evidence/02-database-union.PNG)

### Análisis

La cláusula `OR 1=1` hace que la condición del `WHERE` siempre sea verdadera, mientras que `UNION SELECT` permite combinar el resultado original con una nueva consulta. La función `database()` devuelve el nombre de la base de datos activa, información que normalmente no debería estar disponible para un usuario.

---

## Prueba 3 – Obtención del usuario de la base de datos

Se ejecutó la siguiente consulta:

```sql
test' UNION SELECT NULL, user() #
```

### Resultado

La aplicación mostró el valor:

```text
root@localhost
```

**Evidencia:**

![Query 3](/testing_lab_3/evidence/03-consulta-personalizada.PNG)

### Análisis

La función `user()` permitió identificar que la aplicación se conecta a MySQL utilizando el usuario **root**. Esto representa un riesgo importante, ya que una cuenta con privilegios administrativos puede facilitar el acceso completo a la base de datos en caso de que la vulnerabilidad sea explotada.

Como buena práctica, las aplicaciones deben utilizar usuarios con los permisos mínimos necesarios para realizar sus operaciones.

---

# 5. Parte 2 – Análisis estático con SonarCloud

Como segunda actividad se realizó un análisis estático del proyecto **TicketFlow** utilizando SonarCloud sobre un fork del repositorio del proyecto.

El objetivo fue identificar posibles problemas de seguridad, confiabilidad y mantenibilidad sin necesidad de ejecutar la aplicación.

## Resultados obtenidos

| Métrica                     | Resultado      |
| --------------------------- | -------------- |
| Líneas de código analizadas | 9.1k           |
| Security                    | 27 issues      |
| Reliability                 | 16 issues      |
| Maintainability             | 59 issues      |
| Duplications                | 0.5 %          |
| Security Hotspots           | 0              |
| Coverage                    | No configurada |

**Evidencias**

![Sonarcloud1](/testing_lab_3/evidence/04-sonarcloud-dashboard.PNG)
![Sonarcloud2](/testing_lab_3/evidence/05-sonarcloud-security.PNG)
![Sonarcloud](/testing_lab_3/evidence/06-sonarcloud-reliability.PNG)
![Sonarcloud](/testing_lab_3/evidence/07-sonarcloud-maintainability.PNG)

### Análisis

El análisis permitió identificar diferentes oportunidades de mejora en el proyecto.

Se detectaron 27 incidencias relacionadas con seguridad, lo que indica la existencia de posibles vulnerabilidades o malas prácticas que deben revisarse.

En la categoría de confiabilidad se identificaron 16 incidencias que podrían ocasionar comportamientos inesperados o errores durante la ejecución del sistema.

Aunque SonarCloud detectó 59 incidencias relacionadas con mantenibilidad, la calificación obtenida fue **A**, indicando que el código mantiene un buen nivel de organización y puede evolucionar sin grandes dificultades.

La duplicación del código fue únicamente del 0.5 %, lo cual representa un resultado positivo.

Finalmente, la cobertura de pruebas no fue calculada debido a que aún no se encuentra integrada la generación de reportes de cobertura dentro del flujo de integración continua.

---

# 6. Conclusiones

Las pruebas realizadas permitieron comprobar la importancia de incorporar actividades de seguridad desde las primeras etapas del desarrollo del software.

Las pruebas de SQL Injection demostraron que una aplicación que no valida correctamente las entradas del usuario puede exponer información sensible, como el nombre de la base de datos o el usuario con el que se establece la conexión.

Por otra parte, el análisis estático realizado con SonarCloud permitió identificar oportunidades de mejora relacionadas con la seguridad, la confiabilidad y la calidad del código, sin necesidad de ejecutar la aplicación.

Como resultado del laboratorio se concluye que la combinación de pruebas dinámicas y análisis estático proporciona una visión mucho más completa del estado de seguridad de una aplicación y facilita la detección temprana de vulnerabilidades antes de que el sistema sea desplegado en un entorno de producción.
