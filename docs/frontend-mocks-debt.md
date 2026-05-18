# Frontend mocks -> Deuda tecnica de backend

Mapa de los mocks que aun viven en `apps/web/mock/` y `apps/web/modules/**/mock/`.

**Convencion**: los JSON pueden seguir en disco hasta que la integracion real quede validada en staging, pero el backlog distingue entre:
- endpoint faltante en backend;
- endpoint ya existente, pendiente de migracion en frontend.

**Ultima actualizacion**: 2026-05-19.

---

## 1. Mocks con uso activo

### 1.1 `team-matches.json`

**Consumido en**: `app/(page)/equipos/[id]/page.tsx`.

**Estado BE**: resuelto.

- Endpoint disponible: `GET /teams/:teamId/matches?type=last|next`.
- Devuelve `{ lastMatch, nextMatch }` con teams, venue, category y tournament slugs.
- Pendiente real: migrar el FE para dejar de usar el mock.

### 1.2 `category-fixture.json`

**Consumido en**: `modules/tournament/components/CategoryDetailContent.tsx`.

**Estado BE**: resuelto con workaround de v1.

- Endpoint disponible: `GET /categories/:categoryId/fixture`.
- Hoy agrupa por dia calendario y nombra rondas como `Fecha N`.
- Devuelve `409 FIXTURE_NOT_PUBLISHED` cuando el torneo todavia no esta en `PLAYING`, `FINISHED` o `ARCHIVED`.
- Pendiente real: si se necesita una ronda logica multi-dia, sumar `Match.roundNumber`.

### 1.3 `category-standings.json`

**Consumido en**: `modules/tournament/components/CategoryDetailContent.tsx`.

**Estado BE**: resuelto.

- Endpoint disponible: `GET /categories/:categoryId/standings`.
- Computa PJ, PG, PP, PF, PC, DP y puntos por zona.
- Devuelve `409 FIXTURE_NOT_PUBLISHED` cuando el torneo todavia no esta en `PLAYING`, `FINISHED` o `ARCHIVED`.
- Pendiente real: migrar el FE.

### 1.4 `team-stats.json` + `player-stats.json`

**Consumido en**: `app/(page)/equipos/[id]/page.tsx`.

**Estado BE**: resuelto.

- Endpoints disponibles:
  - `GET /teams/:teamId/stats`
  - `GET /teams/:teamId/player-stats`
- Pendiente real: migrar el FE y validar el shape final en staging.

### 1.5 `team-balance.json`

**Consumido en**: `app/(page)/equipos/[id]/balance/page.tsx` y `app/(page)/equipos/[id]/gestionar/page.tsx`.

**Estado BE**: resuelto.

- Endpoint disponible: `GET /teams/:teamId/balance`.
- Ya expone un read model agregado de debts, payments y suspensions.
- Pendiente real: conectar `TeamBalanceService` del FE.

---

## 2. Mocks huerfanos

| Archivo | Origen probable | Estado |
|---------|-----------------|--------|
| `mock/admin-matches.json` | Listado de partidos del admin | Sin import activo. Cuando se conecte la pantalla admin, usar `MatchService.getMatches()` con filtros. |
| `mock/registration-payment-config.json` | Config de fees al inscribirse | Sin import activo. Deberia leer de un endpoint `/settings/registration-fees` o equivalente. |
| `mock/registration-players.json` | Roster armado durante una inscripcion | Sin import activo. Probablemente lo cubra `RegistrationService.getRegistrationById()`. |
| `mock/available-players.json` | Busqueda de jugadores externos | Sin import activo. Cuando exista un endpoint publico de busqueda de perfiles, ese flujo se reactiva. |

---

## 3. Prioridades reales

| Prioridad | Trabajo pendiente | Desbloquea |
|-----------|-------------------|------------|
| ALTA | Migrar FE a `GET /teams/:teamId/matches?type=last|next` | Page principal de equipo |
| ALTA | Migrar FE a `GET /categories/:categoryId/standings` | Tab Posiciones |
| MEDIA | Migrar FE a `GET /categories/:categoryId/fixture` | Tab Fixture |
| MEDIA | Migrar FE a `GET /teams/:teamId/balance` | Balance y gestionar equipo |
| MEDIA-BAJA | Migrar FE a `GET /teams/:teamId/stats` y `/teams/:teamId/player-stats` | Seccion stats del equipo |
| BAJA | Sumar `GET /settings/registration-fees` si el flujo nuevo vuelve a usarlo | Wizard de inscripcion |
| BAJA | Sumar `GET /profiles/search?q=...` publico | Busqueda de jugadores externos |
