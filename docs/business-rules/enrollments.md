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
- **Regla**: Un equipo anotado en una categoría de un torneo puede ser **movido a otra categoría** dentro del mismo torneo (por ejemplo, por cupos).
- **Notas**: Definir quién lo ejecuta (admin) y si arrastra pagos/estado de la inscripción original.

## RN-040 — Equipo en 1 categoría por torneo

- **Contexto**: Inscripción de equipo en un torneo.
- **Regla**: Un equipo puede postularse a **una única categoría por torneo**, aunque esté habilitado para jugar en más de una (ver [RN-044](./tournaments.md#rn-044--categorías-del-torneo-y-asignación-habilitada-por-equipo)).
- **Contraste**: No confundir con el caso del jugador, que vía distintos equipos puede participar en hasta 2 categorías del mismo torneo (ver [RN-038](./players.md#rn-038--máximo-de-equipos-por-torneo)).

## RN-041 — Resolución de conflicto multi-equipo por seña

- **Contexto**: Jugador anotado en más equipos del mismo torneo de los permitidos por [RN-007](./players.md#rn-007--no-duplicar-equipo-en-la-misma-categoría) / [RN-038](./players.md#rn-038--máximo-de-equipos-por-torneo).
- **Regla**: El jugador queda oficialmente asignado al **equipo que primero paga la seña** y asegura el lugar (ver [RN-015](#rn-015--inscripción-oficial-requiere-ambos-pagos) / [RN-016](#rn-016--plaza-asegurada-sin-poder-jugar)). En los otros equipos donde quedó anotado pero **no pudo confirmarse**, el jugador queda en **estado de conflicto** y la **organización es notificada** para resolverlo.
- **Notas**: El estado de conflicto es visible para el delegado del equipo afectado; la resolución final la maneja la organización.

## RN-042 — Incorporación de jugadores con torneo iniciado

- **Contexto**: Alta de un jugador a un equipo ya inscripto en un torneo que **ya comenzó**.
- **Regla**: Un equipo puede sumar un jugador a su roster del torneo después de iniciado el torneo, siempre que:
  1. El jugador tenga el **seguro** pago — si no lo tiene (y no aplica la reutilización de [RN-017](#rn-017--reutilización-de-seguro-ya-pagado)), debe abonarlo.
  2. Se abone un **fee adicional** por registrar al jugador **fuera de la ventana regular** de inscripción del equipo en ese torneo.
- **Configuración**: El valor del fee es **configurable y editable a nivel torneo** (ver [RN-021](./pricing.md#rn-021--tarifas-configurables)).
- **Motivo**: Permitir refuerzos durante el torneo sin abrir la puerta a abusos.
- **Notas**: Refina la nota de [RN-009](./teams.md#rn-009--mínimo-de-jugadores-en-lista-de-buena-fe) sobre "arancel diferenciado".
