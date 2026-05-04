# Feature: photographers (multimedia)

> Owner: W3.2 — `feat/api/staff-completion`. Cubre RN-051.

## Casos de uso

1. **Asignar fotógrafo a partido** — flujo común de `MatchStaff` con `role='photographer'`. Ver [staff.md](./staff.md) — `POST /api/v1/staff/matches/:matchId/assign`.
2. **Crear carpeta Drive del partido — automático** — al iniciar el partido (`match.started`), un listener crea la carpeta de Google Drive si hay fotógrafo asignado.
3. **Crear carpeta Drive — manual** — `POST /api/v1/staff/matches/:matchId/photo-folder` (admin). Útil para regenerar o crear sin esperar al inicio del partido.
4. **Consultar URL de la carpeta** — el `folderUrl` queda persistido como `MatchAnnouncement(type='photo_folder_created', message=<folderUrl>)` y emitido en `match.photoFolder.created` para que otras features (notificaciones) lo consuman.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-051 | Carpeta Drive por partido | docs/business-rules/matches.md |
| RN-050 | Asignación admin de staff (incluye multimedia) | docs/business-rules/matches.md |

## Modelo de integración

### Port — `IGoogleDrivePort`

Contrato definido en `apps/api/src/staff/application/ports/drive.port.ts`:

```ts
interface IGoogleDrivePort {
  createMatchFolder(input: {
    matchId: string;
    name: string;
    parentFolderId?: string;
  }): Promise<{ folderId: string; folderUrl: string }>;
}
```

### Adapter — STUB en W3.2

`apps/api/src/staff/infrastructure/adapters/google-drive.adapter.ts` es un stub que loguea y devuelve:
- `folderId = 'stub-${matchId}'`
- `folderUrl = 'https://drive.google.com/drive/folders/stub-${matchId}'`

Decisión: dejamos el contrato + wiring; la integración real con Google Drive API se implementa después. **TODO**: requiere service account credentials y decisión de carpeta padre por torneo (RN-051 + DP-015).

### Persistencia

Como `Match` no tiene un campo `photoFolderUrl` ni `metadata`, el `folderUrl` se persiste como `MatchAnnouncement`:
```
type    = 'photo_folder_created'
title   = 'Carpeta multimedia creada'
message = <folderUrl>
createdBy = <profileId del fotógrafo si tiene cuenta, sino un admin>
```

El FE puede consumir `MatchAnnouncement` filtrando por `type`.

## Flujo automático (RN-051)

```
W3.1 — match.started ─────────────────┐
                                      │
                                      ▼
                            MatchStartedListener (W3.2)
                                      │
                                      ▼
                  ¿hay MatchStaff role=photographer en estado activo?
                            │ no                          │ sí
                            ▼                             ▼
                  log info + return            CreateMatchPhotoFolderUseCase
                                                          │
                                                          ▼
                                                IGoogleDrivePort.createMatchFolder
                                                          │
                                                          ▼
                                            persiste MatchAnnouncement
                                                          │
                                                          ▼
                                          emite match.photoFolder.created
```

## Formato del nombre de la carpeta (DP-015)

**Default mientras DP-015 está abierta**:
```
{tournamentSlug}/{categorySlug}/{YYYY-MM-DD}/{home-slug}-vs-{away-slug}
```

Slugify aplicado a fallbacks (cuando un slug es null, usa el `name`). Estructura jerárquica para mantener orden por torneo y categoría.

Cuando DP-015 cierre, basta con cambiar la función `buildDefaultFolderName` en `create-match-photo-folder.use-case.ts`.

## Permisos del Drive

RN-051 establece que **los permisos a nivel Google Drive no se gestionan desde la plataforma**. La aplicación solo crea la carpeta y devuelve el link. La gestión de quién puede ver/editar queda en manos del manejo externo del Drive.

## Eventos

Emitido:
- `match.photoFolder.created` — `{ matchId, folderId, folderUrl }`. Disponible para que features de notificaciones avisen al fotógrafo y a los equipos cuando corresponda.

Escuchado:
- `match.started` — gatilla creación automática.

## Pendientes / TODOs

- **DP-015** — formato del nombre. Default actual: jerárquico por torneo/categoría/fecha.
- **Integración Google Drive real** — adapter stub por ahora. Pasos cuando se priorice:
  1. Configurar service account en Google Cloud.
  2. Variables `.env`: `GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
  3. Reemplazar `GoogleDriveAdapter` con implementación que use `googleapis`.
  4. Manejar reintento idempotente: si el folderId ya existe en `MatchAnnouncement`, no crear duplicado.
- **Notificación al fotógrafo** — al crearse la carpeta, podría dispararse un email con el `folderUrl`. Hoy no lo hacemos en W3.2 (lo cubrirá W3.4 — notifications wiring sobre `match.photoFolder.created`).
