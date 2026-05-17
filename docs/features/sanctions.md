# Feature: sanctions

> Owner original: W3.3. Cubre sanciones disciplinarias y monetarias, blacklist global y adjuntos privados sobre `MediaAsset`.

## Casos de uso

1. Crear sancion para perfil o equipo.
2. Listar y consultar sanciones.
3. Resolver sancion activa.
4. Cancelar sancion activa.
5. Subir adjunto a sancion.
6. Crear entrada de blacklist.
7. Listar y levantar blacklist.
8. Subir adjunto a blacklist.
9. Consultar blacklist por DNI.
10. Consumir listeners deportivos para fechas cumplidas y AJC.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-003 | Suspension por cantidad de partidos | `docs/business-rules/players.md` |
| RN-030 | AJC | `docs/business-rules/fines.md` |
| RN-031 | Estados y gestion de sanciones | `docs/business-rules/fines.md` |
| RN-038 | Restricciones deportivas por torneo | `docs/business-rules/players.md` |

## Modelo

### Entidades principales

- `sanctions`
- `blacklist_entries`

Campos relevantes en sancion:
- `targetType`
- `targetProfileId`
- `targetTeamId`
- `kind`
- `status`
- `reason`
- `notes`
- `attachmentUrls[]`
- `matchId`
- `tournamentId`
- `categoryId`

Campos relevantes en blacklist:
- `documentNumber`
- `profileId`
- `profileNameSnapshot`
- `status`
- `reason`
- `attachmentUrls[]`

### Estados y transiciones

`ACTIVE -> RESOLVED`

`ACTIVE -> CANCELLED`

`ACTIVE -> EXPIRED`

- `BlacklistEntry.status`: `ACTIVE | LIFTED`.
- Las sanciones con conteo de fechas persisten el progreso dentro de `notes`.

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/v1/sanctions` | admin/master | Crear sancion |
| GET | `/api/v1/sanctions` | admin/master | Listar sanciones |
| GET | `/api/v1/sanctions/:id` | admin/master | Detalle |
| POST | `/api/v1/sanctions/:id/resolve` | admin/master | Resolver |
| POST | `/api/v1/sanctions/:id/cancel` | admin/master | Cancelar |
| POST | `/api/v1/sanctions/:id/attachments` | admin/master | Subir adjunto a sancion |
| POST | `/api/v1/blacklist` | admin/master | Crear blacklist |
| GET | `/api/v1/blacklist` | admin/master | Listar blacklist |
| POST | `/api/v1/blacklist/:id/lift` | admin/master | Levantar blacklist |
| POST | `/api/v1/blacklist/:id/attachments` | admin/master | Subir adjunto a blacklist |
| GET | `/api/v1/blacklist/check/:documentNumber` | public | Consultar bloqueo por DNI |

### Uploads de adjuntos

- `POST /api/v1/sanctions/:id/attachments`
  - `multipart/form-data`, campo `file`.
  - Crea `MediaAsset` `PRIVATE` con `category=SANCTION_ATTACHMENT`.
  - Guarda URL firmada en `attachmentUrls[]`.
  - Usa prefijo `sanctions/:id`.
- `POST /api/v1/blacklist/:id/attachments`
  - `multipart/form-data`, campo `file`.
  - Crea `MediaAsset` `PRIVATE` con `category=BLACKLIST_ATTACHMENT`.
  - Guarda URL firmada en `attachmentUrls[]`.
  - Usa prefijo `blacklists/:id`.

## Casos especiales

- Si entra `profileId`, la creacion de blacklist resuelve el DNI desde `Profile`.
- Al crear una blacklist activa sobre un perfil, se desactivan sus memberships activas.
- El conteo de fechas cumplidas se persiste dentro de `notes` para evitar migracion extra.
- Los uploads nuevos usan `MediaAsset`, pero se mantiene compatibilidad con entradas legacy que ya tenian `attachmentUrls`.

## Eventos del dominio

Eventos emitidos:
- `sanction.created`
- `sanction.resolved`
- `sanction.cancelled`
- `sanction.fechaCumplida.added`
- `sanction.ajc.applied`
- `blacklist.created`
- `blacklist.lifted`

Eventos escuchados:
- `match.finished`
- `sanction.ajc.applied`

## Errores especificos

- `SANCTION_NOT_FOUND`
- `SANCTION_INVALID_TRANSITION`
- `BLACKLIST_ALREADY_ACTIVE`
- `BLACKLIST_NOT_ACTIVE`
- `AJC_INVALID_SANCTION`
- `AJC_INVALID_FECHAS`

## Pendientes

- La mecanica fina de AJC sigue dependiendo de DP-007.
- Las notificaciones automaticas se documentan por separado en `notifications.md`.
