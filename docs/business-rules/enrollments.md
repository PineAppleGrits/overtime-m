# Reglas de Negocio — Postulaciones e Inscripción

## RN-004 — Roster histórico por torneo (snapshot)

- **Contexto**: Inscripción de equipo en un torneo.
- **Regla**: La lista de jugadores de un equipo **en un torneo** es un snapshot histórico de quiénes fueron inscriptos, y no refleja cambios posteriores en la plantilla actual del equipo.
- **Motivo**: Integridad histórica para estadísticas, suspensiones y oficialidad del torneo.
- **Ejemplo**: Equipo tiene jugadores A, B, C. Inscribe a B y C en un torneo. Si luego B y C son removidos del equipo, en ese torneo siguen figurando como jugadores del equipo.

## RN-013 — Aprobación de postulación por admin

- **Contexto**: Postulación de un equipo a un torneo/categoría.
- **Regla**: Toda postulación debe ser aprobada por un admin. Puede ser rechazada.

## RN-014 — Comprobante requerido en la postulación

- **Contexto**: Postulación de un equipo.
- **Regla**: La postulación debe incluir comprobante (de pago u otro documento requerido).
- **Notas**: Confirmar tipo de comprobante y paso exacto del flujo.

## RN-015 — Inscripción oficial requiere ambos pagos

- **Contexto**: Confirmación de inscripción de equipo.
- **Regla**: Un equipo queda oficialmente anotado únicamente cuando se pagan:
  1. La inscripción del equipo.
  2. Los seguros (calculados **por cantidad de jugadores**).
- **Notas**: Son **dos pagos diferentes**, que pueden realizarse por separado o en conjunto.

## RN-016 — Plaza asegurada sin poder jugar

- **Contexto**: Estado intermedio de inscripción.
- **Regla**: Un equipo puede **pagar la inscripción** y asegurarse la plaza en el torneo, pero **no puede jugar** si no están pagas las pólizas de seguro de los jugadores.
- **Relación**: Ver RN-015.

## RN-017 — Reutilización de seguro ya pagado

- **Contexto**: Alta de jugador que ya juega en otro equipo con seguro vigente.
- **Regla**: Cuando un equipo quiere sumar a un jugador que **ya tiene el seguro pago** (en otro equipo/torneo vigente), el sistema solo cobra la **inscripción** al nuevo equipo (no el seguro nuevamente).
- **Motivo**: Evitar doble cobro del mismo seguro.
- **Notas**: Excepción a la exclusividad por equipo ([RN-002](./teams.md#rn-002--exclusividad-de-jugador-por-equipo)); confirmar compatibilidad con [RN-007](./players.md#rn-007--no-duplicar-equipo-en-la-misma-categoría).

## RN-018 — Publicación progresiva de equipos aceptados

- **Contexto**: Visualización pública del torneo.
- **Regla**: A medida que se aceptan los equipos en un torneo, se muestran en la plataforma (no se espera a cerrar inscripciones).

## RN-019 — Recategorización de inscripción

- **Contexto**: Gestión de inscripciones.
- **Regla**: Un equipo anotado en una categoría de un torneo puede ser **movido a otra categoría** dentro del mismo torneo.
- **Notas**: Definir quién lo ejecuta (admin) y si arrastra pagos/estado de la inscripción original.
