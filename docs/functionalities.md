# Funcionalidades

Features de la plataforma. Cada funcionalidad puede estar planificada, en desarrollo, o ya implementada. A diferencia de las reglas de negocio (invariantes del dominio, ver [business-rules/](./business-rules/)), acá se listan capacidades/pantallas/flujos.

## Formato

Cada funcionalidad se identifica con `F-XXX` y contiene:

- **Estado**: `planificada` | `en diseño` | `en desarrollo` | `implementada`.
- **Versión objetivo**: ej. `V1.2.0`, o `A definir`.
- **Descripción**: qué hace.
- **Notas**: detalles, dependencias, reglas relacionadas, dudas pendientes.

---

## F-001 — Registro de solicitudes de jugadores/empleados

- **Estado**: planificada
- **Versión objetivo**: V1.2.0
- **Descripción**: Espacio dentro de la plataforma para registrar solicitudes de jugadores y empleados.
- **Notas**: Alcance y flujo a definir.

## F-002 — Anotador en vivo

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Herramienta para anotar estadísticas de un partido en tiempo real mientras se juega.
- **Notas**: Eventos a registrar y permisos a definir.

## F-003 — Estadísticas computadas de toda la plataforma

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Agregación y cómputo de estadísticas a nivel plataforma (jugadores, equipos, torneos).
- **Notas**: Métricas específicas a definir.

## F-004 — Ticketera / Sistema de soporte

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Sistema interno para gestionar tickets de soporte (consultas, reclamos, bugs reportados por usuarios).

## F-005 — Notificaciones

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Sistema de notificaciones dentro de la plataforma.
- **Casos concretos identificados**:
  - Notificación al **delegado** cuando un jugador de su equipo es suspendido.
- **Notas**: Mensajes automatizados por WhatsApp → ver F-016 (v2).

## F-006 — Blacklist de jugadores con buscador (backoffice)

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Listado administrable de jugadores bloqueados con buscador por **DNI** y **nombre**.
- **Notas**: Relacionado con entidad "Bloqueo / Suspensión de jugador" en domain-model y RN-003.

## F-007 — Integración con servicios de canchas

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Conexión con servicios externos para **consultar disponibilidad y reservar** espacios de cancha.
- **Notas**: Definir proveedor/API.

## F-008 — Recategorizar inscripción de equipo

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Un admin puede mover la inscripción de un equipo de una categoría a otra dentro del mismo torneo.
- **Regla relacionada**: RN-019.

## F-009 — Delegados secundarios

- **Estado**: planificada (v2)
- **Versión objetivo**: V2
- **Descripción**: Posibilidad de asignar múltiples delegados (primario + secundarios) a un equipo.
- **Regla relacionada**: RN-005.

## F-010 — Apto médico + declaración jurada (upload y firma digital)

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: El jugador descarga el formulario, lo firma digitalmente y lo sube a la plataforma. Se valida la vigencia anual.
- **Regla relacionada**: RN-008.

## F-011 — Filtros en listado de jugadores (backoffice)

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Filtros avanzados sobre el listado de jugadores (por equipo, categoría, estado de apto, suspensiones, etc.).

## F-012 — Gestión de transacciones y pagos (backoffice)

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Ingresar, editar o eliminar transacciones/pagos desde el backoffice.
- **Regla relacionada**: RN-031 (estados de deudas).

## F-013 — Amistosos (solicitud + seña)

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Un equipo crea una solicitud de amistoso. La organización genera el partido. Cada equipo confirma pagando una seña dentro de 24 hs.
- **Reglas relacionadas**: RN-022, RN-023.

## F-014 — Draft (jugadores sin equipo)

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Formulario para que jugadores sin equipo se postulen (edad, altura, posición, experiencia). Equipos pueden buscarlos y asignarlos.

## F-015 — Ver balances pendientes por equipo

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Vista de saldos pendientes de cada equipo. Accesible para admin y para el delegado del equipo.

## F-016 — Mensajes automatizados por WhatsApp

- **Estado**: planificada (v2)
- **Versión objetivo**: V2
- **Descripción**: Envío automático de mensajes por WPP (recordatorios, confirmaciones, avisos).

## F-017 — Fechas libres

- **Estado**: a definir
- **Versión objetivo**: A definir
- **Descripción**: Gestión de fechas libres en el calendario del torneo. Alcance por definir.

## F-018 — Postulación pública de equipos

- **Estado**: planificada
- **Versión objetivo**: A definir
- **Descripción**: Flujo público para que un equipo se postule a un torneo/categoría. Requiere aprobación admin (RN-013), comprobante (RN-014) y pagos (RN-015).

## F-019 — Playoffs

- **Estado**: a definir
- **Versión objetivo**: A definir
- **Descripción**: Gestión de la fase eliminatoria (`PLAYOFFS_FASE` en la categoría). Formato, seeding y bracket a definir.
