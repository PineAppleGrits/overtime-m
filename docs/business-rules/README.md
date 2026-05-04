# Reglas de Negocio

Reglas que rigen el comportamiento del dominio. Cada regla describe un invariante o restricción, independiente de la implementación técnica. Organizadas por entidad.

## Formato

Cada regla se identifica con `RN-XXX` (numeración global y estable; no reiniciar por archivo) y contiene:

- **Contexto**: dominio o módulo al que aplica.
- **Regla**: enunciado de la restricción/invariante.
- **Motivo**: por qué existe (opcional).
- **Notas**: referencias a tickets, pendientes, dudas.

## Índice por entidad

- [users.md](./users.md) — Usuarios y registro (RN-033–RN-036, RN-057)
- [teams.md](./teams.md) — Equipos y delegados (RN-001, RN-002, RN-005, RN-009, RN-039)
- [players.md](./players.md) — Jugadores (RN-003, RN-006, RN-007, RN-008, RN-037, RN-038)
- [franchises.md](./franchises.md) — Franquicias (RN-010, RN-011, RN-012)
- [enrollments.md](./enrollments.md) — Postulaciones e inscripción (RN-004, RN-013–RN-019, RN-040–RN-042)
- [tournaments.md](./tournaments.md) — Torneos (RN-043–RN-047, RN-058)
- [pricing.md](./pricing.md) — Descuentos y tarifas (RN-020, RN-021, RN-048)
- [friendlies.md](./friendlies.md) — Amistosos (RN-022, RN-023, RN-059)
- [matches.md](./matches.md) — Partidos y tabla (RN-024, RN-049–RN-056)
- [fines.md](./fines.md) — Multas y aranceles (RN-025–RN-032)
- [payments.md](./payments.md) — Pagos (RN-060)

## Ver también

- [../domain-model.md](../domain-model.md) — Entidades, estados y estructura.
- [../functionalities.md](../functionalities.md) — Features y flujos.
