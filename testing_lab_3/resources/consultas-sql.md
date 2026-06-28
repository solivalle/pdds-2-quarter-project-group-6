# Consultas SQL utilizadas

## Descripción

Este documento recopila las consultas utilizadas durante la **Parte 1 del Laboratorio 3**, correspondiente a las pruebas de **SQL Injection** realizadas sobre **DVWA (Damn Vulnerable Web Application)**.

El objetivo de estas consultas fue demostrar cómo una aplicación que no valida correctamente las entradas del usuario puede permitir el acceso a información sensible de la base de datos.

> **Nota:** Todas las pruebas fueron ejecutadas en un entorno de laboratorio controlado utilizando **Metasploitable 2** y **DVWA**, una aplicación diseñada específicamente para el aprendizaje de pruebas de seguridad. Estas técnicas no deben aplicarse sobre sistemas reales sin autorización.

---

# Consulta 1 – Verificación de vulnerabilidad

## Entrada

```text
'
```

## Objetivo

Comprobar si la aplicación valida correctamente los datos ingresados por el usuario.

## Resultado obtenido

La aplicación mostró un error de sintaxis SQL.

## Explicación

El carácter `'` interrumpió la estructura de la consulta SQL generada por la aplicación, demostrando que la entrada del usuario se concatena directamente dentro de la consulta sin realizar validaciones.

Este comportamiento confirma que el formulario es vulnerable a ataques de SQL Injection.

---

# Consulta 2 – Obtención del nombre de la base de datos

## Consulta utilizada

```sql
test' OR 1=1 UNION SELECT NULL, database() #
```

## Objetivo

Obtener el nombre de la base de datos utilizada por la aplicación.

## Resultado obtenido

La consulta devolvió todos los registros de usuarios y agregó una fila con el valor:

```text
dvwa
```

## Explicación

La condición `OR 1=1` hace que el filtro de búsqueda siempre sea verdadero, permitiendo recuperar todos los registros.

Posteriormente, `UNION SELECT` agrega una nueva consulta al resultado original. La función `database()` devuelve el nombre de la base de datos activa, permitiendo identificar que la aplicación utiliza la base de datos **dvwa**.

---

# Consulta 3 – Obtención del usuario de la base de datos

## Consulta utilizada

```sql
test' UNION SELECT NULL, user() #
```

## Objetivo

Identificar el usuario con el que la aplicación establece la conexión hacia MySQL.

## Resultado obtenido

La aplicación mostró:

```text
root@localhost
```

## Explicación

La función `user()` devuelve el usuario actualmente conectado al servidor de base de datos.

En este caso se identificó que la aplicación utiliza el usuario **root**, lo cual representa un riesgo importante desde el punto de vista de la seguridad, ya que dicha cuenta posee privilegios administrativos sobre la base de datos.

Como buena práctica, las aplicaciones deberían utilizar cuentas con permisos limitados, aplicando el principio de mínimo privilegio.

---

# Lecciones aprendidas

Las pruebas realizadas permitieron comprender el proceso que normalmente sigue un atacante al explotar una vulnerabilidad de SQL Injection:

1. Verificar la existencia de la vulnerabilidad mediante una entrada inválida.
2. Obtener información del entorno, como el nombre de la base de datos.
3. Obtener información del servidor, como el usuario con el que se realiza la conexión.
4. Utilizar la información obtenida para planificar ataques posteriores.

Estos resultados evidencian la importancia de implementar validación de entradas, consultas parametrizadas y una adecuada configuración de permisos en la base de datos para reducir el riesgo de explotación.
