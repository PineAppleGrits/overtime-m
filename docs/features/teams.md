# Feature: teams

> Feature owner: W1.3. Cubre la gestión core del equipo (creación, lista de buena fe, capitán, logo y promoción a franquicia). La **categorización** del equipo (niveles globales) vive en `categorization.md`.

## Casos de uso

1. **Crear equipo** — un usuario con DNI validado crea un equipo eligiendo un deporte (RN-001, RN-034).
2. **Listar mis equipos** — el usuario ve los equipos donde es creador o miembro activo.
3. **Listar equipos** (público) — paginado.
4. **Ver detalle de equipo** (público).
5. **Actualizar equipo** — solo admin/master (RN-005 — el delegado/creador no puede editar datos).
6. **Soft-delete equipo** — solo admin/master.
7. **Agregar jugador** — alta en lista de buena fe, validando blacklist y RN-002 (no estar activo en otro equipo del mismo deporte).
8. **Quitar jugador** — desactiva la membresía.
9. **Asignar capitán** — el capitán debe ser miembro activo.
10. **Subir logo** — multipart upload, crea `MediaAsset` y actualiza `Team.logoAssetId`.
11. **Ver estado de roster (RN-009)** — devuelve `{count, min, max, isValid}` para una modalidad.
12. **Promover a franquicia** — solo el creador puede promover su equipo a franquicia (existente).

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-001 | Lista de buena fe al crear equipo | docs/business-rules/teams.md |
| RN-002 | Exclusividad de jugador por equipo (mismo deporte) | docs/business-rules/teams.md |
| RN-005 | Permisos del delegado (creador) | docs/business-rules/teams.md |
| RN-009 | Mínimo de jugadores en lista de buena fe | docs/business-rules/teams.md |
| RN-034 | DNI obligatorio para crear equipo | docs/business-rules/users.md |
| RN-039 | Categorización previa antes de inscribirse | docs/business-rules/teams.md |
| RN-044 | Niveles del equipo limitan categorías a inscribir | docs/business-rules/tournaments.md |

RN-039 y RN-044 se documentan en `categorization.md`; este doc se enfoca en la operatoria del equipo.

## Modelo

### Entidad principal
- **Tabla**: `teams`
- **Campos relevantes**: `id`, `name`, `slug`, `sportId`, `franchiseId`, `creatorId`, `captainId`, `logoUrl` (legacy), `logoAssetId` (PR0), `deletedAt`.
- **Relaciones**: `Sport`, `Franchise?`, `Profile (creator/captain)`, `ProfileTeam[]`, `MediaAsset (TeamLogo)`, `TeamCategoryLevel[]`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/teams | user (DNI ok) | Crear equipo |
| GET    | /api/v1/teams | public | Listar paginado |
| GET    | /api/v1/teams/mine | user | Mis equipos |
| GET    | /api/v1/teams/:id | public | Detalle |
| PATCH  | /api/v1/teams/:id | admin/master | Actualizar |
| DELETE | /api/v1/teams/:id | admin/master | Soft-delete |
| POST   | /api/v1/teams/:id/players | user | Agregar jugador |
| DELETE | /api/v1/teams/:id/players/:profileId | user | Quitar jugador |
| PATCH  | /api/v1/teams/:id/captain/:profileId | user | Asignar capitán |
| GET    | /api/v1/teams/:id/roster-status?modality=5v5 | user | Estado roster (RN-009) |
| POST   | /api/v1/teams/:id/logo | user | Subir logo (multipart) |
| POST   | /api/v1/teams/:id/promote | user (creator) | Promover a franquicia |
| POST   | /api/v1/tournaments/:tournamentId/teams | user | Crear equipo dentro de un torneo |

### POST /api/v1/teams

- **Auth**: usuario autenticado, con `Profile.documentVerified=true` (RN-034).
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 403 | PROFILE_DNI_REQUIRED | Creator sin `documentNumber` |
  | 403 | PROFILE_DNI_NOT_VERIFIED | Creator con DNI pero sin verificar |
  | 404 | NOT_FOUND | Sport o captainId inválidos |

### POST /api/v1/teams/:id/players

- Valida blacklist (`EligibilityService`).
- **RN-002**: si el `profileId` ya tiene una membresía activa en otro equipo del mismo deporte → `409 TEAM_PLAYER_ALREADY_IN_OTHER_TEAM`.

### GET /api/v1/teams/:id/roster-status?modality=5v5

- Lee la strategy `SportRulesRegistry.get(sportCode, modality)` y compara contra `count = profileTeam.count(isActive=true)`.
- `modality` debe ser uno de `BASKETBALL_MODALITIES` (`5v5`, `3v3`).
- **Response**: `{ teamId, modality, count, min, max, isValid }`.

### POST /api/v1/teams/:id/logo

- **Content-Type**: `multipart/form-data`, campo `file`.
- Crea `MediaAsset` con `category=TEAM_LOGO`, `visibility=PUBLIC`. Actualiza `team.logoAssetId`. Borra el asset previo si existía.
- **Response**: `{ assetId, url }`.

## Casos especiales

- **Re-add de jugador desactivado**: si la membresía ya existía con `isActive=false`, `addPlayer` la reactiva en lugar de crear una nueva (idempotente).
- **Conflicto RN-002 en promoción a franquicia**: no se mueve la lista — la promoción solo agrega el `franchiseId` al equipo.
- **Logo previo**: se intenta soft-delete; si falla el storage, se loguea warning y se sigue con el alta del nuevo asset.

## Eventos del dominio

Eventos que esta feature **emite**:
- (Pendiente) `team.created` — payload `{ teamId, createdBy }`. Se agregará junto con notificaciones (W3.4).

Eventos que esta feature **escucha**:
- ninguno por ahora.

## Errores específicos

Códigos usados (todos ya existen en `ErrorCode` desde PR0):
- `PROFILE_DNI_REQUIRED`, `PROFILE_DNI_NOT_VERIFIED` (RN-034).
- `TEAM_PLAYER_ALREADY_IN_OTHER_TEAM` (RN-002).
- `MEDIA_UPLOAD_FAILED` (logo vacío/inválido).
- `SPORT_RULES_NOT_FOUND` (modality no soportada).

## Pendientes / TODOs

- **DP-002 — tope máximo de roster en 5v5**. El `SportRulesRegistry` usa **25** como default. Cuando se cierre la decisión, sólo hay que ajustar `Basketball5v5Rules.roster.rosterMax`.
- Permisos del delegado (RN-005) más finos: por ahora `update`/`delete` son admin-only; en una iteración futura se agregaría una capa que permita al `creator` editar campos no sensibles si la organización lo decide.
- Endpoint `POST /api/v1/teams/:id/registrations/:registrationId` (delegado inscribe equipo) — vive en W2.2 Registrations; este doc lo referenciará cuando esa PR aterrice.
