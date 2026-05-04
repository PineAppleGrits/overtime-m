# Feature: categorization

> Feature owner: W1.3. Cubre **niveles globales por deporte** (`CategoryLevel`) y la **asignación de niveles a equipos** (`TeamCategoryLevel`). Habilita las RNs RN-039, RN-044 y RN-058 (esta última solo en su parte de definir los niveles; los ascensos/descensos se materializan en W3.1).

## Casos de uso

1. **Crear nivel global** (admin/master) — agrega un nivel `A`, `B`, etc. al deporte.
2. **Listar niveles del deporte** (público) — orden por `rank ASC` (1 = más alto).
3. **Actualizar nivel** (admin/master) — cambiar `code`, `displayName`, `rank`.
4. **Eliminar nivel** (admin/master) — solo si no tiene equipos ni categorías asociados.
5. **Asignar nivel(es) a un equipo** (admin/master) — agrega hasta 2 niveles por equipo.
6. **Reemplazar niveles del equipo** (admin/master) — sobrescribe el set completo.
7. **Quitar un nivel del equipo** (admin/master).
8. **Ver categorización del equipo** — devuelve los niveles + cantidad de amistosos observados.
9. **Listar equipos pendientes de categorizar** (admin/master) — equipos con N+ amistosos `observedForCategorization=true` y sin niveles asignados.
10. **Verificar elegibilidad para inscripción** (puerto interno) — consumido por W2.2 Registrations.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-039 | Categorización previa antes de inscribirse | docs/business-rules/teams.md |
| RN-044 | Hasta 2 niveles por equipo; categorías habilitadas según nivel | docs/business-rules/tournaments.md |
| RN-058 | Ascensos/descensos modifican el nivel del equipo (escritura) | docs/business-rules/tournaments.md |

RN-058 se respeta a nivel modelo (los niveles se pueden actualizar). La materialización **automática** post-temporada vive en W3.1 (Playoffs).

## Modelo

### Entidades

- **`CategoryLevel`** — niveles globales por deporte. Campos: `id`, `sportId`, `code` (único por deporte), `displayName`, `rank` (1 = más alto). Tabla: `category_levels`.
- **`TeamCategoryLevel`** — asignación equipo↔nivel. Campos: `id`, `teamId`, `categoryLevelId`, `grantedByProfileId`, `grantedAt`, `notes?`. Único `(teamId, categoryLevelId)`. Tabla: `team_category_levels`.
- **`Category.categoryLevelId?`** — la categoría de un torneo opcionalmente apunta a un nivel global. Si está seteado, solo equipos con ese nivel pueden inscribirse (RN-044).

### Estados y transiciones

No aplican estados — ambos modelos son simples records. Cambiar el set de niveles del equipo es una operación atómica (`replaceForTeam`).

## Endpoints

### Niveles globales (`CategoryLevel`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET    | /api/v1/sports/:sportId/category-levels | public | Lista niveles ordenados por `rank ASC` |
| POST   | /api/v1/sports/:sportId/category-levels | admin/master | Crear nivel |
| PATCH  | /api/v1/sports/:sportId/category-levels/:levelId | admin/master | Actualizar |
| DELETE | /api/v1/sports/:sportId/category-levels/:levelId | admin/master | Eliminar (si no está en uso) |

### Categorización del equipo (`TeamCategoryLevel`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET    | /api/v1/teams/:teamId/categorization | user | Ver niveles + observados |
| POST   | /api/v1/teams/:teamId/categorize | admin/master | Agregar (sin reemplazar) |
| PATCH  | /api/v1/teams/:teamId/categorize | admin/master | Reemplazar set completo |
| DELETE | /api/v1/teams/:teamId/categorize/:teamCategoryLevelId | admin/master | Quitar nivel |
| GET    | /api/v1/teams/categorization/pending | admin/master | Equipos con N+ amistosos observados |

### POST /api/v1/teams/:teamId/categorize

- **Auth**: `admin/master`.
- **Body**:
  ```ts
  {
    levelCodes: string[]; // 1-2 códigos, alfanuméricos en mayúscula
    notes?: string;
  }
  ```
- **Response 200**: `TeamCategorizationDto`.
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | Más de 2 códigos, duplicados o vacío |
  | 400 | VALIDATION_FAILED | El equipo ya tiene 2 niveles y se intenta agregar más |
  | 404 | NOT_FOUND | Equipo o código no encontrados |

- **Eventos**: emite `team.categorized`.

### GET /api/v1/teams/:teamId/categorization

- Devuelve `TeamCategorizationDto`:
  ```ts
  {
    teamId: string;
    levels: CategoryLevelDto[];
    observedFriendlies: number;
    isCategorized: boolean;
  }
  ```

### GET /api/v1/teams/categorization/pending

- **Auth**: `admin/master`.
- Devuelve equipos sin niveles que tengan al menos **N=3 amistosos** con `observedForCategorization=true` (sumando rol home + away).
- N es default; ver DP-008.

## Puerto interno: `ICategorizationCheckPort`

Consumido por W2.2 Registrations para validar inscripciones (RN-039, RN-044). Token DI: `CATEGORIZATION_CHECK_PORT`.

```ts
interface ICategorizationCheckPort {
  check(teamId: string, categoryId: string): Promise<CategorizationCheckResult>;
  assertCanRegisterToCategory(teamId: string, categoryId: string): Promise<void>;
}
```

`assertCanRegisterToCategory` lanza:
- `BusinessError(ErrorCode.TEAM_NOT_CATEGORIZED, 403)` si el equipo no tiene niveles (RN-039).
- `BusinessError(ErrorCode.TEAM_NOT_ELIGIBLE_FOR_CATEGORY, 403)` si la categoría tiene `categoryLevelId` y el equipo no lo posee (RN-044).

Si la categoría no tiene `categoryLevelId` configurado, no se aplica la restricción RN-044 (se asume "categoría libre").

## Eventos del dominio

Eventos que esta feature **emite**:
- `team.categorized` — payload `{ teamId, categoryLevelIds, grantedBy }`. Se emite tanto en agregar como en reemplazar (después de la persistencia exitosa).

Eventos que **NO se emiten** todavía:
- `team.promoted`, `team.relegated` — se difieren a Ola 3 (W3.1 Playoffs).

## Errores específicos

Códigos usados (todos ya existen en `ErrorCode` desde PR0):
- `TEAM_NOT_CATEGORIZED` (RN-039).
- `TEAM_NOT_ELIGIBLE_FOR_CATEGORY` (RN-044).
- `VALIDATION_FAILED` (más de 2 niveles, duplicados, etc.).
- `CONFLICT` (código de nivel duplicado por deporte; nivel con uso al intentar borrar).

## Pendientes / TODOs

- **DP-008 — cantidad de amistosos para categorizar**. `ListPendingCategorizationUseCase` usa **3** como default (`DEFAULT_MIN_OBSERVED_FRIENDLIES_FOR_CATEGORIZATION`). Cuando se cierre, ajustar la constante.
- **Revalidación entre temporadas** (también DP-008). Hoy la categorización es persistente. Si se decide expirar, hace falta sumar fecha de vigencia en `TeamCategoryLevel`.
- **`team.promoted` / `team.relegated`** — implementar en W3.1.
