# Feature: playoffs

> Owner: W3.1 — `feat/api/match-lifecycle-playoffs`. Cubre RN-024 (tiebreaker BO1 0-0), RN-045, RN-047, RN-058.

## Casos de uso

1. **Generar bracket (admin)** — `POST /api/v1/categories/:categoryId/playoffs/generate`. Lee standings, configura series, crea matches físicos. Mueve la categoría a `PLAYOFFS_FASE`.
2. **Override manual de una serie (admin)** — `PATCH /api/v1/categories/:categoryId/playoffs/series/:seriesId`. Reasigna `home/away`. Solo permitido antes de iniciar playoffs.
3. **Avance al ganador (interno)** — listener interno de `match.finished` (`AdvanceOnWinnerUseCase`). Recalcula la serie, marca COMPLETED, propaga a series alimentadas y crea sus matches.
4. **Tiebreaker manual BO1 0-0 (admin)** — `POST /api/v1/playoff-series/:id/resolve-tiebreaker`. Para los casos de RN-024 administrativo.
5. **Generar repechaje (admin)** — `POST /api/v1/categories/:categoryId/promotion-playoff/generate`. RN-058.
6. **Bracket público** — `GET /api/v1/categories/:categoryId/playoffs/bracket`.
7. **Detalle de serie** — `GET /api/v1/playoff-series/:id`.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-024 | 0-0 no suma (tiebreaker manual BO1) | docs/business-rules/matches.md |
| RN-045 | Formato torneo (incluye playoffs) | docs/business-rules/tournaments.md |
| RN-047 | BO1/BO3/BO5 por ronda configurable | docs/business-rules/tournaments.md |
| RN-058 | Ascensos / descensos / repechaje | docs/business-rules/tournaments.md |

## Modelo

### Entidades (PR0)

- **`PlayoffSeries`** — un enfrentamiento de playoff. Campos clave: `categoryId`, `round`, `bracketPosition`, `format`, `homeTeamId/awayTeamId` (nullable cuando dependen de feeders), `feedsFromSeriesAId/feedsFromSeriesBId`, `winnerTeamId`, `status` (`PENDING|READY|IN_PROGRESS|COMPLETED`).
- **`Match.seriesId`, `Match.seriesGameNumber`, `Match.playoffStage`** — los partidos físicos de la serie.
- **`Category` config**: `zonesCount`, `qualifierCount`, `qualifiersPerZone`, `hasPlayIn`, `hasThirdPlaceMatch`, `playoffFormatByRound`.
- **`Tournament.promotionPlayoffFormat`** — formato del repechaje (default BO1).
- Enums Prisma: `PlayoffRound`, `PlayoffFormat`, `PlayoffSeriesStatus`.

### Algoritmo de bracket generation

Implementado en `apps/api/src/playoffs/domain/rules/bracket-generation.rules.ts` (función pura, testeable).

#### 1 zona (zonesCount=1)

- N clasificados ordenados por `zoneRank`.
- Primera ronda = QF si N≥8, SF si N≥4, FINAL si N=2.
- Cruces: 1 vs N, 2 vs N-1, ..., dentro de la zona.
- Series posteriores: alimentadas por `feedsFromA/B` con `bracketPosition` 2i-1 / 2i.

#### 2 zonas (zonesCount=2, DP-003 NBA)

- Si hay 4 por zona (8 totales): cuartos cruzados:
  - QF1: 1°A vs 4°B
  - QF2: 2°A vs 3°B
  - QF3: 1°B vs 4°A
  - QF4: 2°B vs 3°A
- Semis: SF1 alimentada por QF1+QF2, SF2 por QF3+QF4.
- Final: alimentada por SF1+SF2.
- Si solo hay 2 por zona (4 totales): semis directas (1°A vs 2°B, 1°B vs 2°A) → final.

#### Tercer puesto

- Si `hasThirdPlaceMatch=true` y existen semifinales, se agrega serie THIRD_PLACE alimentada por las dos SF (los perdedores). El admin debe poblar el `homeTeamId/awayTeamId` con el loser de cada SF (no automático en advance-on-winner — TODO).

#### Play-in (DP-014)

- `hasPlayIn=true` está reservado para un PLAY_IN entre 8°/9° de la regular. **TODO: implementación queda preparada en el plan, pendiente DP-014** sobre formato y mecánica exacta.

### Tabla de wins-to-clinch

| Format | Games | Wins to clinch |
|--------|-------|----------------|
| BO1 | 1 | 1 |
| BO3 | 3 | 2 |
| BO5 | 5 | 3 |

### Avance al ganador (advance-on-winner)

`AdvanceOnWinnerUseCase`:

1. Trigger: listener `@OnEvent('match.finished')` (todos los matches; filtra por `seriesId != null`).
2. Lee la serie y todos sus matches.
3. Aplica `computeSeriesProgress(home, away, format, matches)` (función pura) — solo cuenta wins de matches con `countsForStandings=true`.
4. Si una serie alcanza wins-to-clinch: `markSeriesCompleted(seriesId, winnerTeamId)`. Emite `playoff.series.completed`.
5. Busca series con `feedsFromSeriesAId == this.id || feedsFromSeriesBId == this.id`. Asigna el winner al slot correspondiente (`assignTeams`). Si quedan ambos slots completos, status pasa a READY y crea sus matches físicos.
6. Si la serie es BO1 y todos los matches terminaron 0-0 (administrativo, RN-024) → `needsTiebreaker=true`. La serie no se cierra; admin debe resolver vía `/playoff-series/:id/resolve-tiebreaker`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/v1/categories/:categoryId/playoffs/generate | admin | Generar bracket |
| GET | /api/v1/categories/:categoryId/playoffs/bracket | público | Bracket completo |
| PATCH | /api/v1/categories/:categoryId/playoffs/series/:seriesId | admin | Override manual |
| GET | /api/v1/playoff-series/:id | público | Detalle de una serie |
| POST | /api/v1/playoff-series/:id/resolve-tiebreaker | admin | Tiebreaker BO1 0-0 |
| POST | /api/v1/categories/:categoryId/promotion-playoff/generate | admin | Repechaje (RN-058) |

### POST /api/v1/categories/:categoryId/playoffs/generate

- **Pre-condición**: regular completa (todos los `Match.matchType='regular'` finalizados). Si no, lanza `PLAYOFF_PHASE_NOT_READY`.
- **Pre-condición**: la categoría no debe tener series ya generadas (idempotente). Si las hay, lanza `PLAYOFF_ALREADY_GENERATED`.
- **Body**: `{ baseDate?: string (ISO) }` — fecha de inicio sugerida para el game 1 de cada serie. Default: ahora.
- **Response 200**: `{ seriesIds: string[], categoryId }`.
- **Eventos**: `category.playoffs.started`, `playoff.bracket.generated`.

### POST /api/v1/categories/:categoryId/promotion-playoff/generate

- **Pre-condición**: la categoría inferior y la superior deben estar `FINISHED` (sus matches incluido playoffs cerrados).
- **Lógica RN-058**: busca la categoría con `categoryLevel.rank = lower.rank - 1` en el mismo torneo. Si existe, crea `PlayoffSeries(round=PROMOTION_PLAYOFF)` con `Tournament.promotionPlayoffFormat` (default BO1), home = último de la superior, away = 2° de la inferior. Crea matches físicos.
- **Response**:
  - Si hay categoría superior → `{ generated: true, seriesId }`.
  - Si NO hay → `{ generated: false, reason: '...' }`.
- **Eventos**: `playoff.promotion.generated`.
- **Nota**: la promoción del equipo (mover `TeamCategoryLevel`) **NO es automática** — la feature emite `team.promoted`/`team.relegated` cuando un futuro listener (en `team-categorization`) lea `playoff.promotion.generated` y el winner de la serie. Por ahora queda como acción manual del admin.

## Errores específicos

- `PLAYOFF_PHASE_NOT_READY` — regular incompleta o standings inconsistentes.
- `PLAYOFF_ALREADY_GENERATED` — bracket ya creado.
- `PLAYOFF_INSUFFICIENT_TEAMS` — clasificados < 2 (no se puede armar bracket).
- `PLAYOFF_OVERRIDE_LOCKED` — el bracket ya tiene matches en curso/finalizados; no se puede modificar manualmente.
- `PLAYOFF_SERIES_NOT_TIE` — tiebreaker pedido sobre una serie que no terminó 0-0 administrativo.
- `PLAYOFF_PROMOTION_NOT_READY` — categoría superior/inferior no `FINISHED`.

## Eventos del dominio

Eventos que esta feature **emite**:

- `category.playoffs.started` — payload `{ categoryId }`.
- `playoff.bracket.generated` — payload `{ categoryId, seriesIds }`.
- `playoff.series.completed` — payload `{ seriesId, categoryId, winnerTeamId, loserTeamId }`. Standings + listener de team-categorization (futuro) consumen.
- `playoff.promotion.generated` — payload `{ seriesId, upperCategoryId, lowerCategoryId, upperTeamId, lowerTeamId }`.

Eventos que esta feature **escucha**:

- `match.finished` — `AdvanceOnWinnerUseCase`. Recalcula la serie cuando uno de sus matches termina.

## Pendientes / TODOs

- **DP-001** — defaults de BO format por ronda. Hoy hardcoded como `defaultFormat='BO3'` para QF/SF y `BO5` para final si lo pasa el config (`Category.playoffFormatByRound`). Cuando se cierre, ajustar defaults en `bracket-generation.rules.ts`.
- **DP-005** — formato y momento del repechaje. Hoy: action explícita admin, formato leído desde `Tournament.promotionPlayoffFormat` (default BO1). Marcado en `GeneratePromotionPlayoffUseCase`.
- **DP-014** — detalles del play-in (8°/9°). El flag `hasPlayIn` existe; la generación de la serie PLAY_IN está estubada (placeholder). TODO en `bracket-generation.rules.ts`.
- **Tercer puesto** — la asignación automática del loser de SF al THIRD_PLACE necesita un listener adicional (`computeSeriesProgress.loserTeamId` ya está disponible, pero `AdvanceOnWinnerUseCase` solo propaga winners). Se agregará cuando un test E2E lo demande.

## Decisiones de diseño

- **Bracket como reglas puras**: `planBracket` es función pura, sin dependencias en Prisma — testeable con casos sintéticos. La capa de uso (`GenerateBracketUseCase`) lee standings y persiste series + matches en una transacción.
- **Series alimentan series, matches físicos vienen después**: al generar el bracket creamos todas las series (con `feedsFromSeriesA/B`) en la primera transacción. Solo las series con `homeTeamId+awayTeamId` definidos arrancan con `READY` y reciben sus matches físicos. Las que dependen de winners empiezan en `PENDING` — `AdvanceOnWinnerUseCase` les asigna teams y crea matches.
- **Localía alterna por gameNumber**: G1 en cancha del home, G2 en visitante, G3 en home, etc. (`g % 2 === 1` decide).
- **`countsForStandings` en `match.finished` es la fuente de verdad** para decidir wins en `computeSeriesProgress`. El módulo no consulta `SportRulesRegistry` directamente — usa el flag del payload.
- **Tiebreaker manual BO1 0-0 separado**: `AdvanceOnWinnerUseCase` no cierra la serie si todos sus matches BO1 terminaron 0-0 administrativo. El admin resuelve vía endpoint dedicado y se emite `playoff.series.completed`.
