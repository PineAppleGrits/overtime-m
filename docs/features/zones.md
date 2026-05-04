# Feature: zones

## Casos de uso

1. **Crear zona** — admin agrega una zona dentro de una categoría. Validado contra `Category.zonesCount` (máx 2 — DP-003).
2. **Editar zona** — admin edita nombre / fixtureAlgorithm.
3. **Soft-delete zona** — admin.
4. **Asignar equipo a zona** — admin agrega un equipo a una zona específica. Reglas: 1 zona por categoría / 1 categoría por torneo / sport debe coincidir.
5. **Remover equipo de zona** — admin.
6. **Auto-balance teams** — admin distribuye los equipos con inscripción aprobada del torneo entre las zonas existentes (round-robin determinístico, idempotente).
7. **Listar zonas / detalle** — público.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-044 | Categorías y elegibilidad por categorización (un equipo solo en N categorías habilitadas) | docs/business-rules/tournaments.md |
| RN-045 | Formato de torneo (incluye configuración de zonas y clasificados a playoffs) | docs/business-rules/tournaments.md |

DPs:
- **DP-003 [resuelta]** — máximo 2 zonas por categoría en v1.

## Modelo

### Entidad principal
- **Tabla**: `zones`
- **Campos**: `name`, `categoryId`, `fixtureAlgorithm` (`'round_robin' | 'custom'`), `createdAt`, `updatedAt`, `deletedAt`.
- **Relaciones**: pertenece a `Category`; tiene N `TeamZone` (asignaciones de equipos); tiene N `Match`.

### TeamZone
- **Tabla**: `team_zones`
- **Campos**: `teamId`, `zoneId`, `assignedAt`.
- Relación N:1 con `Team` y N:1 con `Zone`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/categories/:categoryId/zones | admin | Crear zona |
| POST   | /api/v1/categories/:categoryId/zones/auto-balance | admin | Auto-distribuir equipos aprobados (round-robin) |
| GET    | /api/v1/categories/:categoryId/zones | public | Listar zonas |
| GET    | /api/v1/categories/:categoryId/zones/:id | public | Detalle |
| PATCH  | /api/v1/categories/:categoryId/zones/:id | admin | Editar |
| DELETE | /api/v1/categories/:categoryId/zones/:id | admin | Soft-delete |
| POST   | /api/v1/categories/:categoryId/zones/:id/teams | admin | Asignar equipo |
| DELETE | /api/v1/categories/:categoryId/zones/:id/teams/:teamId | admin | Remover equipo |

### POST /api/v1/categories/:categoryId/zones

- **Auth**: `admin` / `master`.
- **Request body**:
  ```ts
  {
    name: string
    fixtureAlgorithm?: 'round_robin' | 'custom'
  }
  ```
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 404 | NOT_FOUND | Categoría no existe |
  | 409 | CATEGORY_TOO_MANY_ZONES | La categoría ya tiene `zonesCount` zonas creadas |

### POST /api/v1/categories/:categoryId/zones/auto-balance

- **Auth**: `admin` / `master`.
- **Body**: vacío.
- **Comportamiento**:
  1. Levanta los `Registration` con `status='aprobada'` del torneo+categoría.
  2. Levanta las zonas existentes de la categoría (orden por `createdAt ASC` para determinismo).
  3. Verifica que `existingZones.length >= category.zonesCount` (si no, lanza `CATEGORY_TOO_MANY_ZONES`).
  4. Filtra los equipos ya asignados a alguna zona de la categoría (idempotente).
  5. Distribuye round-robin: `teams[i] → zones[i % zones.length]`.
  6. Persiste con `createMany({ skipDuplicates: true })`.
- **Response 200**:
  ```ts
  {
    categoryId: string
    totalTeams: number
    totalZones: number
    assignmentsByZone: { [zoneId]: string[] }   // teamIds finales por zona
    newAssignments: { zoneId, teamId }[]        // solo los nuevos de esta corrida
  }
  ```
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | CATEGORY_TOO_MANY_ZONES | Hay menos zonas que `category.zonesCount` |
  | 400 | VALIDATION_FAILED | La categoría no tiene zonas |
  | 404 | NOT_FOUND | Categoría no existe |

### POST /api/v1/categories/:categoryId/zones/:id/teams

- **Auth**: `admin` / `master`.
- **Request body**: `{ teamId: string }`.
- **Validaciones**:
  1. Equipo existe.
  2. **1 zona por categoría** — si el equipo ya está en otra zona de la misma categoría → `409 Conflict`.
  3. **1 categoría por torneo** — si el equipo ya está en otra categoría del mismo torneo → `409 Conflict`.
  4. Sport del equipo coincide con sport del torneo.

## Casos especiales

- **Auto-balance idempotente**: si se corre 2 veces sin nuevas inscripciones, la segunda corrida no inserta nada (todos los teams ya tienen `TeamZone`).
- **Equipos extra**: si llegan más equipos aprobados que zonas, los equipos extra se distribuyen respetando round-robin (zonas con 1 equipo más).
- **Re-balance manual**: el endpoint solo *agrega* asignaciones nuevas. Para mover un equipo entre zonas, primero `DELETE .../teams/:teamId`, luego `POST .../teams` o re-correr auto-balance tras limpieza.

## Eventos del dominio

Eventos que esta feature **emite**: ninguno (las asignaciones de zona no disparan eventos de dominio en v1).

## Errores específicos

Reutiliza códigos definidos en PR0:
- `CATEGORY_TOO_MANY_ZONES` — DP-003 / faltan zonas para auto-balance.
- `VALIDATION_FAILED` — auto-balance sin zonas.

## Pendientes / TODOs

- **Re-balance "destructivo"**: hoy `auto-balance` no toca asignaciones existentes. Cuando aparezca el caso de uso real (ej. admin pidió "redistribuye todo"), agregar flag `force: true` que limpie y re-asigne.
- **Validación de "todas las zonas tienen capacidad similar"**: hoy se asume round-robin puro; si más adelante hay reglas de "no más de X equipos por zona" según `Category.teamsPerZone`, agregar validación.
- **Eventos**: si el FE necesita reaccionar a `team.assignedToZone`, agregar evento. Por ahora se cubre con re-fetch del detalle.
