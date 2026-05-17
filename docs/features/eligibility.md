# Feature: eligibility

> Owner original: W3.3. Consolida chequeos de elegibilidad deportiva y documental sin romper consumers legacy de `matches`, `registrations` y `teams`.

## Casos de uso

1. Chequear elegibilidad de jugador para partido.
2. Chequear elegibilidad de jugador para torneo.
3. Chequear elegibilidad de equipo para partido.
4. Subir apto medico propio.
5. Subir declaracion jurada propia.
6. Consultar historico documental del perfil.
7. Mantener compatibilidad con rutas legacy mientras el FE migra.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-003 | Suspension de jugadores | `docs/business-rules/players.md` |
| RN-007 | No duplicar jugador en misma categoria | `docs/business-rules/players.md` |
| RN-008 | Apto medico y DDJJ anuales | `docs/business-rules/players.md` |
| RN-037 | Estado activo/inactivo del jugador | `docs/business-rules/players.md` |
| RN-038 | Maximo 2 equipos por torneo | `docs/business-rules/players.md` |
| RN-053 | Deuda pendiente bloquea siguiente partido | `docs/business-rules/matches.md` |

## Modelo

### Entidades y dependencias

- No agrega tabla propia.
- Lee `Profile`, `Team`, `Match`, `Category`, `Tournament` y `MediaAsset`.
- Depende de:
  - `SanctionsModule` para sanciones activas y blacklist.
  - `DebtsModule` para bloqueo economico del equipo.
  - `MediaAssetService` para apto medico y DDJJ versionados.

### Salida de dominio

- `EligibilityCheckResult` resume `eligible`, `reasons[]` y blockers especificos.
- La facade `EligibilityService` expone:
  - `getPlayerMatchEligibility`
  - `getPlayerTournamentEligibility`
  - `getTeamMatchEligibility`
  - `assertProfileEligibleForRegistration`
  - `assertTeamEligibleForRegistration`
  - `assertTeamEligibleForMatch`

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/v1/eligibility/players/:profileId/match/:matchId` | admin/master | Check consolidado jugador-partido |
| GET | `/api/v1/eligibility/players/:profileId/tournament/:tournamentId` | admin/master | Check consolidado jugador-torneo |
| GET | `/api/v1/eligibility/teams/:teamId/match/:matchId` | admin/master | Check consolidado equipo-partido |
| GET | `/api/v1/eligibility/profiles/:profileId` | admin/master | Endpoint legacy de elegibilidad de perfil |
| GET | `/api/v1/eligibility/teams/:teamId` | admin/master | Endpoint legacy de elegibilidad de equipo |
| POST | `/api/v1/eligibility/profiles/me/medical-cert` | auth | Subir apto medico |
| POST | `/api/v1/eligibility/profiles/me/sworn-statement` | auth | Subir DDJJ |
| GET | `/api/v1/eligibility/profiles/:profileId/medical-history` | admin/master | Historico documental |

### Uploads documentales

- `POST /api/v1/eligibility/profiles/me/medical-cert`
  - `multipart/form-data`, campo `file`.
  - Crea `MediaAsset` `PRIVATE` con `category=MEDICAL_CERT`.
  - Actualiza el asset actual del perfil y conserva historico anual.
  - Emite `medical-cert.uploaded`.
- `POST /api/v1/eligibility/profiles/me/sworn-statement`
  - Mismo patron que apto medico.
  - Emite `sworn-statement.uploaded`.

## Casos especiales

- `EligibilityController` mantiene rutas legacy de sanctions y blacklist bajo `/eligibility/*`.
- `registrations` y `teams` consumen la facade, no el controller HTTP.
- La vigencia documental se resuelve por anio calendario.
- El bloqueo economico para partido se consume desde el dominio de `matches`.

## Eventos del dominio

Eventos emitidos:
- `medical-cert.uploaded`
- `sworn-statement.uploaded`

Eventos escuchados:
- ninguno

## Errores especificos

- `PROFILE_MEDICAL_CERT_EXPIRED`
- `PROFILE_SWORN_STATEMENT_MISSING`
- `PROFILE_SUSPENDED`
- `PROFILE_BLACKLISTED`
- `PLAYER_TOURNAMENT_LIMIT_EXCEEDED`
- `PLAYER_CATEGORY_DUPLICATE`

## Pendientes

- La validacion automatica de DNI sigue fuera de este modulo y depende de DP-009.
- La regla del 50 por ciento para habilitar jugar sigue pendiente de DP-006.
- Las rutas legacy de sanctions y blacklist deberian retirarse cuando el FE migre a rutas canonicas.
