# Feature: users

> Owner original: W3.4. Mezcla un CRUD legacy administrativo con flujos nuevos de DNI, pre-creacion y asignacion de roles.

## Casos de uso

1. CRUD administrativo de usuarios.
2. Ver perfil propio.
3. Consultar estado activo o inactivo.
4. Subir foto de DNI propia.
5. Verificar DNI manualmente.
6. Asignar rol a una cuenta existente.
7. Pre-crear cuenta para onboarding posterior.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-033 | Registro con Google sin DNI inicial | `docs/business-rules/users.md` |
| RN-034 | DNI obligatorio para crear equipo | `docs/business-rules/users.md` |
| RN-035 | DNI como nexo con registros previos | `docs/business-rules/users.md` |
| RN-036 | Validacion de DNI por foto | `docs/business-rules/users.md` |
| RN-037 | Estado activo/inactivo del jugador | `docs/business-rules/players.md` |
| RN-057 | Asignacion de roles por staff | `docs/business-rules/users.md` |

## Modelo

### Entidad principal

- `profiles`

Campos relevantes:
- `role`
- `documentNumber`
- `documentVerified`
- `documentVerifiedBy`
- `documentVerifiedAt`
- `dniPhotoAssetId`
- `medicalCertificateUrl` y `swornStatementUrl` legacy
- `currentMedicalAssetId` y `currentSwornAssetId` en flujos nuevos

### Estados derivados

- `ProfileActiveStatus` se calcula:
  - activo si el perfil tiene al menos un equipo;
  - inactivo si no tiene memberships activas.

## Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/v1/users` | admin | Crear usuario legacy |
| GET | `/api/v1/users` | admin | Listar usuarios legacy |
| GET | `/api/v1/users/:id` | admin | Detalle legacy |
| PATCH | `/api/v1/users/:id` | admin | Actualizar legacy |
| DELETE | `/api/v1/users/:id` | admin | Borrar legacy |
| GET | `/api/v1/profiles/me` | auth | Perfil propio |
| GET | `/api/v1/profiles/me/status` | auth | Estado propio |
| POST | `/api/v1/profiles/me/dni-photo` | auth | Subir foto de DNI |
| POST | `/api/v1/users/:id/verify-dni` | admin/master | Verificar DNI manualmente |
| POST | `/api/v1/users/:id/role` | admin/master | Cambiar rol |
| POST | `/api/v1/users/pre-create` | admin/master | Pre-crear cuenta |
| GET | `/api/v1/users/:id/status` | admin/master | Estado de otro perfil |

### Flujos clave

- `POST /api/v1/profiles/me/dni-photo`
  - `multipart/form-data`, campo `file`.
  - Crea `MediaAsset` `PRIVATE` con `category=DNI_PHOTO`.
  - Actualiza `dniPhotoAssetId`.
  - Resetea la verificacion previa.
  - Llama a `IDniVerificationPort`.
  - Hoy el adapter es stub y devuelve `requiresManualReview=true`.
- `POST /api/v1/users/:id/verify-dni`
  - Normaliza y valida DNI.
  - Bloquea si el documento ya pertenece a otra cuenta real.
  - Fusiona perfiles stub cuando corresponde.
  - Marca `documentVerified`.
  - Emite `profile.dni.verified` y, si aplica, `profile.merged`.
- `POST /api/v1/users/:id/role`
  - Usa `role-assignment.rules`.
  - Evita escalaciones invalidas.
  - Solo emite evento si realmente cambia el rol.
  - Emite `profile.role.changed`.

## Casos especiales

- La verificacion manual puede fusionar relaciones desde un stub sin `supabaseUserId`.
- La verificacion automatica de DNI sigue pendiente de DP-009.
- Conviven controller y service legacy con la facade nueva de clean architecture.

## Eventos del dominio

Eventos emitidos:
- `profile.dni.verified`
- `profile.dni.pendingReview`
- `profile.role.changed`
- `profile.merged`

Eventos escuchados:
- ninguno

## Errores especificos

- `PROFILE_DNI_REQUIRED`
- `PROFILE_DNI_NOT_VERIFIED`
- `PROFILE_DNI_PHOTO_REQUIRED`
- `PROFILE_DNI_ALREADY_VERIFIED`
- `PROFILE_DOCUMENT_NUMBER_TAKEN`
- `PROFILE_ROLE_INVALID`
- `PROFILE_NOT_FOUND`
- `PROFILE_EMAIL_ALREADY_EXISTS`

## Pendientes

- La validacion automatica de DNI sigue stub hasta cerrar DP-009.
- El CRUD legacy todavia no migro por completo a clean architecture.
- La documentacion medica historica vive principalmente en `eligibility.md`.
