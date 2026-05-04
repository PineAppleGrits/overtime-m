# Feature: categories

## Casos de uso

1. **Crear categoría** — admin crea una categoría dentro de un torneo. Acepta vínculo opcional a `CategoryLevel` (RN-044), config inicial de playoffs y zonas.
2. **Editar categoría** — admin edita campos básicos y/o config de playoffs. Bloqueado si la categoría ya entró en fase de playoffs (RN-047).
3. **Vincular `CategoryLevel`** — al crear o editar, se valida que el level pertenezca al mismo deporte que el torneo padre (RN-044).
4. **Configurar playoffs (zonas + clasificados + formato por ronda)** — endpoint dedicado `PATCH .../playoff-config`.
5. **Ver config de playoffs efectiva** — endpoint `GET .../playoff-config` devuelve persistido + default sugerido del deporte/modalidad.
6. **Transición REGULAR_FASE → PLAYOFFS_FASE** — caso de uso interno que emite `category.playoffs.started` (consumido por feature `playoffs` para generar el bracket).
7. **Transición a FINISHED** — emite `category.finished` con `championTeamId`, `runnerUpTeamId`, `lastTeamId` cuando el caller los conoce.
8. **Listar categorías por torneo / detalle** — público.
9. **Soft-delete categoría** — admin.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-044 | Categorías del torneo y elegibilidad por categorización del equipo | docs/business-rules/tournaments.md |
| RN-045 | Formato de torneo (incluye configuración de zonas) | docs/business-rules/tournaments.md |
| RN-047 | Formato de playoffs BO1/BO3/BO5 configurable y editable hasta inicio de playoffs | docs/business-rules/tournaments.md |

DPs vinculadas:
- **DP-003 [resuelta]** — máximo 2 zonas por categoría en v1 (`MAX_ZONES_PER_CATEGORY = 2`).
- **DP-004 [resuelta]** — solo BO1/BO3/BO5 en playoffs (no "ida y vuelta agregado").
- **DP-001** — defaults razonables por deporte/modalidad. Se leen del `SportRulesRegistry` al crear (default actual básquet 5v5: cuartos BO1, semis BO3, final BO5, tercer puesto BO1, play-in BO1).
- **DP-014** — `hasPlayIn` flag por categoría; mecánica completa del play-in pendiente de definir.

## Modelo

### Entidad principal
- **Tabla**: `categories`
- **Campos relevantes** (resaltado los nuevos / usados por esta feature):
  - `name`, `slug`, `tournamentId`, `status`, `substatus`
  - `maxTeams`, `teamsPerZone`
  - `categoryLevelId` — link opcional a `CategoryLevel` global (RN-044)
  - `zonesCount` — 1 o 2 (DP-003)
  - `qualifierCount`, `qualifiersPerZone`
  - `hasPlayIn`, `hasThirdPlaceMatch`
  - `playoffFormatByRound: Json?` — `{ playIn?, quarterfinal?, semifinal?, final?, thirdPlace? }` con valores `'BO1' | 'BO3' | 'BO5'`
- **Relaciones**: pertenece a `Tournament`; tiene N `Zone`; tiene N `Registration`; opcional `CategoryLevel`.

### Estados y transiciones

```
status:    OPEN ──> IN_PROGRESS ──> FINISHED
                                  └──> CLOSED (cancelado)
substatus:        ───> REGULAR_FASE ──(startPlayoffs)──> PLAYOFFS_FASE
```

- Mientras `substatus !== PLAYOFFS_FASE`: la config de playoffs es editable.
- Una vez en `PLAYOFFS_FASE`: queda congelada (RN-047).
- Al finalizar: `status = FINISHED` + evento `category.finished`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/tournaments/:tournamentId/categories | admin | Crear categoría |
| GET    | /api/v1/tournaments/:tournamentId/categories | public | Listar |
| GET    | /api/v1/tournaments/:tournamentId/categories/:id | public | Detalle |
| GET    | /api/v1/tournaments/:tournamentId/categories/:id/playoff-config | public | Config de playoffs (efectiva + default) |
| PATCH  | /api/v1/tournaments/:tournamentId/categories/:id | admin | Editar |
| PATCH  | /api/v1/tournaments/:tournamentId/categories/:id/playoff-config | admin | Editar config de playoffs (validación dedicada) |
| DELETE | /api/v1/tournaments/:tournamentId/categories/:id | admin | Soft-delete |

### POST /api/v1/tournaments/:tournamentId/categories

- **Auth**: `admin` / `master`.
- **Request body** (campos opcionales marcados con `?`):
  ```ts
  {
    name: string
    maxTeams?: number
    teamsPerZone?: number
    status?: CategoryStatus            // 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'FINISHED'
    substatus?: CategorySubstatus      // 'REGULAR_FASE' | 'PLAYOFFS_FASE'
    categoryLevelId?: string           // RN-044
    zonesCount?: number                // 1 o 2 (DP-003)
    qualifierCount?: number
    qualifiersPerZone?: number
    hasPlayIn?: boolean
    hasThirdPlaceMatch?: boolean
    playoffFormatByRound?: { playIn?: 'BO1'|'BO3'|'BO5', quarterfinal?: ..., semifinal?: ..., final?: ..., thirdPlace?: ... }
  }
  ```
- **Defaults**:
  - Si no se pasa `playoffFormatByRound`, se siembra el default sugerido por el `SportRulesRegistry` para `(sportCode, modality)` del torneo (DP-001).
  - `zonesCount` default 1 (campo del schema).
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | `playoffFormatByRound` con claves o formatos inválidos / `categoryLevel` de otro deporte |
  | 400 | CATEGORY_TOO_MANY_ZONES | `zonesCount > 2` |
  | 404 | NOT_FOUND | Tournament/CategoryLevel no existe |
- **RN aplicadas**: RN-044, RN-045, RN-047.

### PATCH /api/v1/tournaments/:tournamentId/categories/:id

Mismo body que POST (todos los campos opcionales). Errores adicionales:

| HTTP | Code | Cuándo |
|------|------|--------|
| 409 | CATEGORY_PLAYOFF_FORMAT_LOCKED | Se intenta editar config de playoffs cuando la categoría ya está en `PLAYOFFS_FASE` (RN-047) |

`categoryLevelId: null` desconecta el link.

### GET /api/v1/tournaments/:tournamentId/categories/:id/playoff-config

- **Auth**: público.
- **Response 200**:
  ```ts
  {
    categoryId: string
    zonesCount: number
    qualifierCount: number | null
    qualifiersPerZone: number | null
    hasPlayIn: boolean
    hasThirdPlaceMatch: boolean
    playoffFormatByRound: { ...persistido } | null
    defaultFormatByRound: { playIn, quarterfinal, semifinal, final, thirdPlace } // del SportRulesRegistry
    effectiveFormatByRound: { ...merge persistido + defaults }
  }
  ```

### PATCH /api/v1/tournaments/:tournamentId/categories/:id/playoff-config

- **Auth**: `admin` / `master`.
- **Body validado por Zod** (`UpdatePlayoffConfigSchema`): mismo subset de la categoría (`zonesCount`, `qualifierCount`, `qualifiersPerZone`, `hasPlayIn`, `hasThirdPlaceMatch`, `playoffFormatByRound`).
- **Response 200**: mismo shape que `GET .../playoff-config`.
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | Schema inválido / JSON con ronda o formato desconocido |
  | 400 | CATEGORY_TOO_MANY_ZONES | `zonesCount > 2` |
  | 409 | CATEGORY_PLAYOFF_FORMAT_LOCKED | Categoría ya en `PLAYOFFS_FASE` |

## Casos especiales

- **No se setean defaults si el torneo no tiene `modality`**: el `SportRulesRegistry.tryGet` devuelve null y la categoría queda con `playoffFormatByRound = null`. El admin puede setear manualmente luego. Cuando el FE pida `GET .../playoff-config`, el `defaultFormatByRound` igualmente se devuelve cayendo a `(BASKETBALL, '5v5')` para no dejar la UI sin sugerencias.
- **Edición parcial**: el endpoint `PATCH .../playoff-config` actualiza solo lo enviado; las claves omitidas mantienen su valor.
- **`playoffFormatByRound: null`**: borra el JSON persistido (vuelve a "usar default").

## Eventos del dominio

Eventos que esta feature **emite**:
- `category.playoffs.started` — payload: `{ categoryId }`. Se emite al transicionar `substatus → PLAYOFFS_FASE` vía `TransitionCategorySubstatusUseCase`. **Trigger pendiente**: la lógica que decide *cuándo* se transiciona vive en W3.1 (Match lifecycle + Playoffs); este worktree solo expone el caso de uso.
- `category.finished` — payload: `{ categoryId, championTeamId?, runnerUpTeamId?, lastTeamId? }`.

Eventos que esta feature **escucha**: ninguno por ahora.

## Errores específicos

Códigos de `ErrorCode` usados:
- `CATEGORY_PLAYOFF_FORMAT_LOCKED` — RN-047 (ya existía en PR0).
- `CATEGORY_TOO_MANY_ZONES` — DP-003 (ya existía en PR0).
- `VALIDATION_FAILED` — JSON inválido o `categoryLevel` de otro deporte.

## Pendientes / TODOs

- **DP-001** — defaults de playoff por modalidad: hoy se usa lo definido en `BASKETBALL_PLAYOFF` (PR0). Cuando se cierre la decisión, se ajustan los valores en `apps/api/src/common/sport-rules/strategies/basketball-base.rules.ts` y se documenta acá.
- **DP-005** — repechaje (RN-058): no está cubierto por este worktree. Cuando W3.1 implemente el cierre de torneo, ese worktree dispara `category.finished` con los datos finales.
- **DP-014** — mecánica completa del play-in: hoy solo flag `hasPlayIn`. La estructura del bracket se diseñará en W3.1.
- **W1.3 (CategoryLevel CRUD)** — la validación de `categoryLevelId` es estricta (mismo `sportId`); cuando W1.3 termine, agregar validaciones extra (level activo, etc.).
