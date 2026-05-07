# Frontend mocks → Deuda técnica de backend

Mapa de los mocks que aún viven en `apps/web/mock/` y `apps/web/modules/**/mock/`. Cada entrada lista qué endpoint/datos faltan en el BE para poder eliminar el mock y consumir datos reales.

**Convención**: los archivos JSON quedan en disco (no se eliminan al integrar) hasta que el endpoint real esté disponible y verificado en staging. Una vez integrado, el mock JSON se borra y el helper `getMockX(...)` también.

**Última actualización**: 2026-05-07.

---

## 1. Mocks con uso activo (alta prioridad)

### 1.1 `team-matches.json` — Último / próximo partido por equipo

**Consumido en**: `app/(page)/equipos/[id]/page.tsx` vía `getMockTeamMatches(teamId)` (`modules/common/components/MatchPreview/mock.ts`).

**Shape esperado**:
```ts
{ lastMatch: MatchPreviewData | null, nextMatch: MatchPreviewData | null }
```
Donde `MatchPreviewData` incluye `id, tournamentSlug, categorySlug, date, location, matchType, team1{id,name,logoUrl}, team2{...}, team1Score?, team2Score?`.

**Servicio FE existente**: `MatchService.getMatches({ ... })` — soporta filtros por `categoryId`, `zoneId`, `status`, etc. **No tiene filtro por `teamId`**.

**Falta en BE**:
- Endpoint dedicado `GET /teams/:teamId/matches?type=last|next` que devuelva los dos partidos relevantes con team info y scores ya populados.
- Alternativa: extender `GET /matches` con filtro `?teamId=...&type=last|next` (where homeTeamId=X OR awayTeamId=X, ordenado por matchDate, devolver el último finalizado y el próximo programado).

**Riesgo de migrar sin endpoint**: cargar todos los matches y filtrar en FE no escala.

---

### 1.2 `category-fixture.json` — Fixture de la categoría agrupado por fecha

**Consumido en**: `modules/tournament/components/CategoryDetailContent.tsx` (tab "Fixture"), pasa los rounds al componente `<FixtureView>`.

**Shape esperado**:
```ts
{ rounds: Array<{ name: string; date: string; matches: MatchPreviewData[] }> }
```

**Servicio FE existente**: `MatchService.getMatches({ categoryId })` — devuelve lista plana de matches.

**Falta en BE**:
- Endpoint `GET /categories/:categoryId/fixture` que devuelva matches agrupados por **ronda** (Fecha 1, Fecha 2, ...). El concepto de "ronda" no es solo agrupar por `matchDate` — pueden jugarse en días distintos pero pertenecer a la misma ronda.
- Alternativa **migrable hoy**: usar `getMatches({ categoryId })` y agrupar en FE por `matchDate` o por un campo `roundNumber` si el modelo lo expone.

**Acción recomendada**: revisar el modelo `Match` de Prisma para ver si ya hay `roundNumber`. Si sí, migrar agrupando en FE; si no, sumar el campo es trabajo de BE.

---

### 1.3 `category-standings.json` — Tabla de posiciones por zona

**Consumido en**: `modules/tournament/components/CategoryDetailContent.tsx` (tab "Posiciones"), componente `<StandingsTable>`.

**Shape esperado**:
```ts
{ zones: Array<{ name: string; standings: Array<{ position, teamName, teamLogo, teamId, played, won, lost, pointsFor, pointsAgainst, diff, points }> }> }
```

**Servicio FE existente**: ninguno.

**Falta en BE**:
- Endpoint `GET /categories/:categoryId/standings` que compute las tablas por zona (PJ, PG, PP, PF, PC, DP, puntos) según las reglas del torneo (FIBA: 2 pts ganado, 1 perdido).

**Bloqueado**: no migrable hasta que el BE exponga el endpoint.

---

### 1.4 `team-stats.json` + `player-stats.json` — Estadísticas agregadas

**Consumido en**: `app/(page)/equipos/[id]/page.tsx` vía `getMockTeamStats(teamId)` y `getMockPlayerStats(teamId)` (`modules/team/mock/playerStats.mock.ts`).

**Shape esperado**:
- Team: `{ playedMatches, won, lost, pointsFor, pointsAgainst }`
- Player (por jugador): `{ played, points, pt1, pt2, pt3, fouls, steals, rebounds, assists, picture }`

**Servicio FE existente**: `MatchService.getMatchPlayerStats(matchId)` — comentado como TODO, devolvería stats **por match**, no acumuladas.

**Falta en BE**:
- `GET /teams/:teamId/stats` — totales acumulados del equipo en toda la temporada.
- `GET /teams/:teamId/player-stats` — totales acumulados por jugador del equipo.
- Sin estos, el equipo no puede mostrar tabla de stats real.

**Bloqueado**: necesita agregación BE (probablemente a partir de la tabla de stats por match cuando exista).

---

### 1.5 `team-balance.json` — Balance de pagos y suspensiones por equipo

**Consumido en**: `app/(page)/equipos/[id]/balance/page.tsx`, `app/(page)/equipos/[id]/gestionar/page.tsx` vía `TeamBalanceService.getTeamBalance(teamId)`.

**Shape esperado**:
```ts
{ totalDebt, totalPaid, pendingConfirmation, registrations: [...], suspensions: [...] }
```

**Servicio FE existente**: `TeamBalanceService` existe pero internamente devuelve el JSON mockeado — no llama al backend.

**Falta en BE**:
- Endpoint `GET /teams/:teamId/balance` que agregue datos de `DebtsService` + `PaymentsService` + `SanctionsService`.
- Alternativa: el FE hace 3 llamadas (debts, payments, sanctions) y compone — más chatty pero no requiere endpoint nuevo. Riesgo: inconsistencia momentánea entre las 3 fuentes.

**Recomendación**: BE expone un read model agregado (más eficiente y consistente).

---

## 2. Mocks huérfanos (sin uso activo)

Quedan en disco por si el flujo se reactiva. Si dentro de un par de iteraciones no se vuelven a usar, se pueden borrar.

| Archivo | Origen probable | Estado |
|---------|-----------------|--------|
| `mock/admin-matches.json` | Listado de partidos del admin | Sin import activo. Cuando se conecte la pantalla de partidos del admin, usar `MatchService.getMatches()` con filtros. |
| `mock/registration-payment-config.json` | Config de fees al inscribirse (cuota inscripción + seguro/jugador) | Sin import activo. Cuando se conecte, debería leer de un endpoint `/settings/registration-fees` o derivado de `siteConfigService`. |
| `mock/registration-players.json` | Roster armado durante una inscripción | Sin import activo. Probablemente el flujo nuevo de inscripción usa `RegistrationService.getRegistrationById()` y derivados. |
| `mock/available-players.json` | Búsqueda de jugadores externos para sumar al equipo | Sin import activo. Hoy hay `searchUsersForTeamAction` en `teamActions.ts` (devuelve `[]` si el endpoint admin-only falla). Cuando se exponga un endpoint público de búsqueda de perfiles, ese flujo se reactiva. |

---

## 3. Resumen prioridades para el backend

| Prioridad | Endpoint a sumar | Desbloquea |
|-----------|------------------|------------|
| **ALTA** | `GET /teams/:teamId/matches?type=last|next` | Section equipos del front (page principal) |
| **ALTA** | `GET /categories/:categoryId/standings` | Tab Posiciones |
| **MEDIA** | `GET /categories/:categoryId/fixture` (o flag `roundNumber` en `Match`) | Tab Fixture |
| **MEDIA** | `GET /teams/:teamId/balance` (read model) | Pantalla balance + gestionar equipo |
| **MEDIA-BAJA** | `GET /teams/:teamId/stats` y `/teams/:teamId/player-stats` | Pantalla detalle de equipo (sección stats). Depende también de que las stats por match estén implementadas. |
| **BAJA** | `GET /settings/registration-fees` | Cuando se reactive el flujo de inscripción nuevo |
| **BAJA** | `GET /profiles/search?q=...` (público) | Búsqueda de jugadores externos en el wizard de equipo |
