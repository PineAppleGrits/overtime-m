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
- **Notas**: Se pueden agregar jugadores antes del inicio del torneo con **arancel diferenciado** desde la página. Confirmar tope máximo (hay referencia a 25 — pendiente) y gatillo para informar a la aseguradora. Para altas **con torneo ya iniciado** ver [RN-042](./enrollments.md#rn-042--incorporación-de-jugadores-con-torneo-iniciado).

## RN-039 — Categorización previa del equipo por la organización

- **Contexto**: Habilitación de un equipo nuevo para postularse a torneos.
- **Regla**: Un equipo recién creado debe recibir una **categorización** por parte de la organización antes de poder postularse a cualquier torneo. Sin esa categorización, el equipo **no puede inscribirse**.
- **Mecanismo**: El equipo solicita **partidos amistosos** (ver [RN-059](./friendlies.md#rn-059--canales-de-solicitud-de-amistoso)). Tras **X partidos amistosos** observados, la organización determina a qué **categoría** asignarlo.
- **Motivo**: Garantizar competencia equilibrada ubicando al equipo en las categorías apropiadas a su nivel.
- **Notas**: Pendiente definir (1) cantidad exacta de amistosos requeridos (X), (2) si la categorización se revalida entre temporadas, (3) si aplica por disciplina y/o modalidad, (4) criterios finos de observación.
- **Relación**: [RN-044](./tournaments.md#rn-044--categorías-del-torneo-y-asignación-habilitada-por-equipo) limita las categorías a las que un equipo puede anotarse a las que le fueron asignadas.
