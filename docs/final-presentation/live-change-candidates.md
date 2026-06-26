live-change-candidates.md# Propuestas de Cambios para la Demostración en Vivo

## Candidato 1 – Acción rápida "Crear incidente crítico"

### Objetivo

Agregar una acción rápida que permita registrar un incidente crítico con un solo clic, utilizando valores predefinidos para acelerar la creación de tickets de alta prioridad.

### Cambios esperados

**Frontend**

* Agregar un botón **"Crear incidente crítico"** en la pantalla principal.
* Mostrar confirmación al usuario una vez creado el ticket.

**Backend**

* Crear un nuevo endpoint:

  * `POST /tickets/critical`
* El endpoint crea automáticamente un ticket con:

  * Prioridad: `Critical`
  * Estado: `Open`
  * Categoría: `Incident`
  * Fecha de creación actual
* Registrar el evento en el historial del ticket.

**Base de datos**

* No requiere cambios de esquema.
* Reutiliza la estructura actual de DynamoDB.

### Servicios AWS involucrados

* EC2 (API)
* DynamoDB
* CloudWatch Logs

### Riesgo

Bajo.

### Valor demostrado

Demuestra la capacidad del pipeline para desplegar cambios funcionales completos en backend y frontend sin modificar la infraestructura principal.

---

# Candidato 2 – Historial visible de actividad del ticket

### Objetivo

Permitir que el usuario consulte el historial de cambios realizados sobre un ticket.

### Cambios esperados

**Frontend**

* Agregar una nueva sección **"Historial"** dentro del detalle del ticket.
* Mostrar cronológicamente los eventos registrados.

**Backend**

* Crear endpoint:

  * `GET /tickets/{id}/history`
* Recuperar y devolver el historial asociado al ticket.

**Base de datos**

* Utilizar el historial existente si ya está almacenado.
* En caso contrario, registrar nuevas entradas a partir de las operaciones futuras.

### Servicios AWS involucrados

* EC2
* DynamoDB
* CloudWatch

### Riesgo

Medio.

### Valor demostrado

Permite evidenciar modificaciones tanto en la API como en la interfaz de usuario y resalta la trazabilidad del sistema.

---

# Candidato 3 – Vista previa de imágenes adjuntas

### Objetivo

Permitir visualizar imágenes adjuntas directamente desde el detalle del ticket sin necesidad de descargarlas.

### Cambios esperados

**Frontend**

* Mostrar miniaturas de los archivos de imagen.
* Abrir una vista previa al seleccionar la imagen.

**Backend**

* Crear endpoint:

  * `GET /attachments/{id}/preview`
* Validar permisos de acceso.
* Generar o devolver la URL del objeto almacenado.

**Almacenamiento**

* Reutilizar Amazon S3 para servir los archivos existentes.

### Servicios AWS involucrados

* EC2
* Amazon S3
* IAM
* CloudWatch

### Riesgo

Medio.

### Valor demostrado

Demuestra integración entre aplicación e infraestructura de almacenamiento, reutilizando el bucket S3 desplegado mediante Terraform.

---
