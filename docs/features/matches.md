# Feature: matches

> Owner: W3.1 — `feat/api/match-lifecycle-playoffs`. Cubre RN-024, RN-032, RN-049, RN-052, RN-053, RN-054, RN-055, RN-056.

## Casos de uso

1. **Crear partido (admin)** — `POST /api/v1/matches`. Mantenido (W1.1). Valida equipos, categoría/zona, cancha y disponibilidad.
2. **Crear partidos en batch (admin)** — `POST /api/v1/matches/batch`.
3. **Listar / detalle** — `GET /api/v1/matches`, `GET /api/v1/matches/:id`. Públicos.
4. **Actualizar partido (admin)** — `PATCH /api/v1/matches/:id`.
5. **Cambiar estado (admin)** — `PATCH /api/v1/matches/:id/status` (compat W1).
6. **Soft-delete (admin)** — `DELETE /api/v1/matches/:id`.
7. **Iniciar partido (admin)** — `POST /api/v1/matches/:id/start`. RN-049 (staff mínimo) + RN-053 (deudas).
8. **Finalizar partido (admin)** — `POST /api/v1/matches/:id/finish`. Valida marcador con SportRules; RN-024 (0-0 administrativo no suma).
9. **Cancelación por equipo (RN-032)** — `POST /api/v1/matches/:id/cancel-by-team`. 72hs y umbral del torneo determinan si reprograma directo o pasa a `pending_rival_decision`.
10. **Resolución del rival (RN-032)** — `PATCH /api/v1/matches/:id/rival-decision`. `request_points` (20-0) o `reschedule`.
11. **Reprogramación admin (RN-052)** — `POST /api/v1/matches/:id/reschedule`. Respeta el umbral del torneo (DP-013) salvo `forceWithoutThreshold`.
12. **Suspensión durante encuentro (RN-054, RN-055)** — `POST /api/v1/matches/:id/suspend`. `reanudar` / `fin_sin_continuidad` / `pendiente`.
13. **Resolver suspendido pendiente (RN-055)** — `POST /api/v1/matches/:id/resolve-suspended`.
14. **Cancelación mutua (RN-056)** — `POST /api/v1/matches/:id/mutual-cancel`. 0-0 administrativo, no suma.
15. **Comunicados** — `POST /api/v1/matches/:id/announcements`, `GET /api/v1/matches/:id/announcements`. Compat W1.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-024 | 0-0 administrativo no suma | docs/business-rules/matches.md |
| RN-032 | Cancelación 72hs (decisión del rival) | docs/business-rules/fines.md |
| RN-049 | Staff mínimo | docs/business-rules/matches.md |
| RN-052 | Reprogramación por antelación | docs/business-rules/matches.md |
| RN-053 | Deuda bloquea siguiente partido | docs/business-rules/matches.md |
| RN-054 | Suspensión durante encuentro | docs/business-rules/matches.md |
| RN-055 | Suspensión sin reprogramación | docs/business-rules/matches.md |
| RN-056 | Cancelación mutua 0-0 | docs/business-rules/matches.md |

## Modelo

### Entidad principal

- **Tabla**: `matches` (modelo `Match`, schema en PR0).
- **Status (string libre)** — valores conocidos:
  - `programado`, `en_curso`, `suspendido`, `cancelado`, `reprogramado`, `finalizado`
  - **W3.1**: `pending_rival_decision`, `suspendido_a_reanudar`, `suspendido_pendiente`, `finalizado_con_resolucion`.
- **Campos PR0**: `seriesId`, `seriesGameNumber`, `playoffStage` (link con PlayoffSeries).

### Estados y transiciones

```
programado ──────┬──> en_curso ──┬──> finalizado
                 ├──> cancelado   ├──> suspendido_a_reanudar ──> en_curso
                 ├──> reprogramado├──> suspendido_pendiente ──> finalizado_con_resolucion
                 └──> pending_rival_decision ──┬──> finalizado (20-0)
                                               └──> programado (rival eligió reprogramar)
```

Las transiciones permitidas viven en `apps/api/src/matches/domain/rules/transitions.rules.ts`. Cada use-case aplica solo las que le competen — si un estado intenta una transición no permitida, lanza `MATCH_INVALID_STATUS_TRANSITION` (`ErrorCode`).

## Endpoints

Tabla resumen (los nuevos de W3.1 marcados con ★):

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/matches | admin | Crear |
| POST   | /api/v1/matches/batch | admin | Crear N |
| PATCH  | /api/v1/matches/batch/status | admin | Cambiar estado N |
| GET    | /api/v1/matches | público | Listar |
| GET    | /api/v1/matches/:id | público | Detalle |
| PATCH  | /api/v1/matches/:id | admin | Actualizar |
| PATCH  | /api/v1/matches/:id/status | admin | Cambiar estado |
| DELETE | /api/v1/matches/:id | admin | Soft-delete |
| POST   | /api/v1/matches/:id/announcements | admin | Crear comunicado |
| GET    | /api/v1/matches/:id/announcements | público | Listar comunicados |
| POST ★ | /api/v1/matches/:id/start | admin | Iniciar (RN-049 + RN-053) |
| POST ★ | /api/v1/matches/:id/finish | admin | Finalizar (sport rules + RN-024) |
| POST ★ | /api/v1/matches/:id/cancel-by-team | auth (delegado) | RN-032 |
| PATCH ★| /api/v1/matches/:id/rival-decision | auth (delegado rival) | RN-032 |
| POST ★ | /api/v1/matches/:id/reschedule | admin | RN-052 |
| POST ★ | /api/v1/matches/:id/suspend | admin | RN-054, RN-055 |
| POST ★ | /api/v1/matches/:id/resolve-suspended | admin | RN-055 |
| POST ★ | /api/v1/matches/:id/mutual-cancel | admin | RN-056 |

### Bodies de los nuevos endpoints

- `POST /:id/start` — sin body.
- `POST /:id/finish` — `{ homeScore, awayScore }`. Lanza `MATCH_INVALID_SCORE` si no pasa `validateScore` del deporte.
- `POST /:id/cancel-by-team` — `{ cancellingTeamId, reason? }`. Errores: `MATCH_CANCEL_NOT_ALLOWED`, `MATCH_CANCEL_WINDOW_EXPIRED`, `FORBIDDEN`. Outcome: `auto_reschedule` | `rival_decision`.
- `PATCH /:id/rival-decision` — `{ decision, rivalTeamId, newDate? }`. Si `request_points`, deja 20-0 a favor del rival y emite `match.finished` con `countsForStandings=true`.
- `POST /:id/reschedule` — `{ newDate, reason?, forceWithoutThreshold? }`.
- `POST /:id/suspend` — `{ reason, currentScore?, resolution, winningTeamId? }`. Si `fin_sin_continuidad`, emite `match.finished` con `resolution=suspended_no_continuation`.
- `POST /:id/resolve-suspended` — `{ resolution, currentScore?, winningTeamId? }`.
- `POST /:id/mutual-cancel` — `{ reason? }`. Score 0-0, `countsForStandings=false`.

## Eventos del dominio

Eventos que esta feature **emite**:

- `match.scheduled` — al crear el partido.
- `match.started` — al iniciar (post-validación staff/deudas).
- `match.finished` — payload con `countsForStandings: boolean` y `resolution: 'organic' | 'rival_request_points' | 'mutual_cancel' | 'suspended_no_continuation'`. **Standings y series de playoff escuchan este evento.**
- `match.suspended` — payload con `resolution: 'reanudar' | 'fin_sin_continuidad' | 'pendiente'` y `currentScore?`.
- `match.resolved` — emite tras `resolveSuspendedMatch`.
- `match.cancelled` — payload con `cancelledByTeamId?` y `requiresRivalDecision?`.
- `match.rescheduled` — payload con `previousDate`, `newDate`, `reason?`.

Eventos que esta feature **escucha**: ninguno (el flujo es push hacia afuera).

## Integraciones con otras features

- **Debts (W2.1)** — inyectado vía `DebtsCheckAdapter` (puerto `IDebtsCheckPort`). Usado en `StartMatchUseCase` para validar RN-053. Soporta el flag `allowFiftyPercentRule` (DP-006), por defecto `false`.
- **Staff** — `StaffCheckAdapter` accede directo a Prisma (`MatchStaff` agrupado por `role`). Cuenta confirmaciones para chequear staff mínimo. RN-049.
- **SportRulesRegistry (PR0)** — para validar score y resolver staff mínimo según `(sportCode, modality)`. Default fallback: BASKETBALL_5v5.
- **Standings (Fixtures)** — `StandingsService` ahora resuelve `scoreCountsForStandings` desde la registry; respeta RN-024 saltando los 0-0 administrativos.

## Casos especiales

- **RN-032 dentro/fuera del umbral**:
  - >= umbral del torneo: reprogramación directa, sin decisión del rival.
  - entre 72hs y umbral: pasa a `pending_rival_decision`.
  - < 72hs: lanza `MATCH_CANCEL_WINDOW_EXPIRED` (no es cancelación en tiempo).
- **DP-013** (umbral configurable): si el torneo tiene `earlyCancellationThresholdHours = null`, default = 72hs.
- **DP-010** (plazo del rival): el rival puede responder en cualquier momento antes de la fecha del partido. **TODO: timer + recordatorio cuando se cierre la decisión.**
- **0-0 administrativo (RN-024)**:
  - `mutual-cancel` deja 0-0 con `countsForStandings=false`.
  - El finalizado orgánico 0-0 también es admitido por `validateScore` (basket no excluye 0-0 a nivel reglas), pero la flag `countsForStandings=false` lo neutraliza en standings.
- **Suspensión sin score parcial**: si `resolution=fin_sin_continuidad` pero no se pasa `currentScore`, lanza `VALIDATION_FAILED`. La planilla del juez debe registrar el marcador.

## Errores específicos

Códigos agregados a `ErrorCode` (sincronizados api ↔ shared):

- `MATCH_INVALID_STATUS_TRANSITION` — transición no permitida.
- `MATCH_STAFF_BELOW_MIN` — RN-049.
- `MATCH_TEAM_HAS_OUTSTANDING_DEBT` — RN-053.
- `MATCH_INVALID_SCORE` — falla `validateScore` del deporte.
- `MATCH_CANCEL_WINDOW_EXPIRED` — fuera del plazo de 72hs (RN-032) o por debajo del umbral del torneo en `reschedule`.
- `MATCH_CANCEL_NOT_ALLOWED` — el partido no está en estado cancelable.
- `MATCH_RIVAL_DECISION_NOT_PENDING` — el partido no está esperando decisión del rival.
- `MATCH_NOT_SUSPENDED` — `resolve-suspended` sobre un partido que no está `suspendido_pendiente`.
- `MATCH_RESOLUTION_INVALID` — combinación de `resolution`/inputs inválida.

## Pendientes / TODOs

- **DP-005** — formato y momento del repechaje (`PROMOTION_PLAYOFF`). Ver `playoffs.md`.
- **DP-006** — regla del 50% (pago parcial habilita siguiente partido). Por ahora bloqueo estricto.
- **DP-010** — plazo del rival ante cancelación 72hs. Sin timer.
- **DP-013** — umbral de antelación configurado por torneo. Default 72hs.

## Decisiones de diseño

- **Refactor mínimamente invasivo**: `MatchesService` original se mantuvo intacto para los endpoints CRUD/batch/announcements. Un nuevo `MatchLifecycleService` cubre los casos de uso de W3.1 con clean architecture (entity + rules + use-cases + ports + adapters). Coexisten dos controllers (`MatchesController`, `MatchLifecycleController`) bajo el mismo path `/matches/...`.
- **Status como string libre**: el schema de Prisma define `Match.status: String`, lo que permite agregar nuevos valores (`pending_rival_decision`, etc.) sin migración. El enum `MatchStatus` del shared se extendió en append.
- **Adapters dedicados** para Staff y Debts: el módulo Matches no importa directamente esos services en sus use-cases — usa puertos. Esto facilita tests con mocks.
- **`match.finished` lleva siempre `countsForStandings` y `resolution`**: ambos consumidores (standings + advance-on-winner playoffs) los necesitan para reaccionar bien.
