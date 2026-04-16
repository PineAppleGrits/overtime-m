# Reglas de Negocio — Equipos y Delegados

## RN-001 — Lista de buena fe al crear equipo

- **Contexto**: Creación de equipo.
- **Regla**: Al crear un equipo se define una lista de jugadores (lista de buena fe).

## RN-002 — Exclusividad de jugador por equipo

- **Contexto**: Alta de jugadores en un equipo.
- **Regla**: Un equipo no puede agregar jugadores que ya pertenezcan a otro equipo (ver excepción en [RN-017](./enrollments.md#rn-017--reutilización-de-seguro-ya-pagado)).
- **Notas**: Referencia ticket `OVRT-22`. Validación incluye chequeo manual de DNI y nombre.

## RN-005 — Permisos del delegado

- **Contexto**: Gestión de equipo.
- **Regla**: Cada equipo tiene un delegado. El delegado **puede inscribir** al equipo, pero **no puede editar** los datos del equipo.
- **Notas**: Confirmar lista completa de acciones permitidas/prohibidas. Delegados secundarios → v2.

## RN-009 — Mínimo de jugadores en lista de buena fe

- **Contexto**: Composición del equipo para participar.
- **Regla**: Se requieren **mínimo 8 jugadores** en la lista de buena fe, y todos deben tener seguro pago.
- **Notas**: Se pueden agregar jugadores antes del inicio del torneo con **arancel diferenciado** desde la página. Confirmar tope máximo (hay referencia a 25 — pendiente) y gatillo para informar a la aseguradora.
