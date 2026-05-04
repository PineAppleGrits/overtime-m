# Feature: Tournaments

> Estado: completado en W1.1 (`feat/api/tournaments-completion`).
>
> Esta feature contiene **Tournament** y sus períodos de precio (`TournamentRegistrationPricing`).
> `Category` y `Zone` viven dentro del módulo Nest pero pertenecen a las features W1.2 (categories + zones)
> y se documentan aparte.

## Casos de uso

1. **Crear torneo (admin)** — crea un torneo con su deporte, modalidad (`5v5`/`3v3`), ventanas de fechas y configuraciones (seguro por jugador, formato de repechaje, umbral de cancelación temprana). Valida que la combinación `(sport, modality)` tenga una strategy registrada en `SportRulesRegistry`.
2. **Actualizar torneo (admin)** — mismas validaciones que en creación + chequeo de transición de estado si se cambia.
3. **Listar torneos (público)** — paginado, filtrable por `status` y por `publishedOnly` (sólo torneos con al menos 1 inscripción aprobada — RN-018).
4. **Obtener torneo por id o slug (público)** — incluye categorías, zonas y registraciones.
5. **Cambiar estado del torneo (admin)** — valida transiciones permitidas y emite `tournament.status.changed`.
6. **Soft-delete torneo (admin)** — marca `deletedAt`.
7. **CRUD de períodos de precio (RN-048, admin)** — crear/editar/eliminar `TournamentRegistrationPricing` con validación de no-overlap por torneo.
8. **Consultar precio vigente (público)** — devuelve el período cuyo rango cubre el instante actual.
9. **Listar reglas públicas del deporte+modalidad (público)** — `GET /api/v1/sports/:sportIdOrCode/rules?modality=5v5` para que el FE muestre rosters/scoring/staff sin hardcodear.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-043 | Modalidad del torneo (3v3 o 5v5) | docs/business-rules/tournaments.md |
| RN-044 | Categorías del torneo (referencial; CRUD vive en W1.2) | docs/business-rules/tournaments.md |
| RN-045 | Formato del torneo (ida / ida y vuelta / playoffs) | docs/business-rules/tournaments.md |
| RN-046 | Fechas del torneo | docs/business-rules/tournaments.md |
| RN-048 | Precio variable por período y método de pago | docs/business-rules/pricing.md |
| RN-058 | Repechaje de ascenso/descenso (campo `promotionPlayoffFormat`) | docs/business-rules/tournaments.md |
| RN-018 | Publicación progresiva (`?publishedOnly=true`) | docs/business-rules/enrollments.md |

## Modelo

### Tournament

- **Tabla**: `tournaments` (modelo `Tournament` en Prisma).
- **Campos relevantes**: `name`, `slug`, `sportId`, `status`, `fixtureFormat`, `modality`, ventanas de fechas (`startDate`/`endDate`, `registrationStartDate`/`registrationEndDate`, `teamOperationsOpenAt`/`teamOperationsCloseAt`), `insurancePerPlayer`, `promotionPlayoffFormat`, `earlyCancellationThresholdHours`.
- **Relaciones**: 1-N con `Category`, `Registration`, `TournamentRegistrationPricing`, `Sanction`. N-1 con `Sport`.

### TournamentRegistrationPricing

- **Tabla**: `tournament_registration_pricing` (RN-048).
- **Campos**: `tournamentId`, `validFrom`, `validTo` (rangos cerrados, **no se solapan dentro del mismo torneo**), `entryFeeAmount`, `currency` (default `ARS`).
- Pago por método se modela como nota — la dimensión "método" se cubrirá en W2.3 (Pricing & Discounts) si requiere precios distintos por método. La RN-048 actual sólo exige el período variable; la diferenciación por método queda como TODO si W2.3 lo amplía.

### Estados y transiciones

```
DRAFT ──────► OPEN ──────► CLOSED ──────► READY_TO_SHIP ──────► IN_PROGRESS ──────► FINISHED ──────► ARCHIVED
  │             │             │                  │                     │              ▲
  │             │             │                  │                     │              │
  └─►───────────┴─►───────────┴─►────────────────┴─►───────────────────┘              │
                                  CANCELLED  (terminal, no vuelve)                    │
                                                                                      │
  ARCHIVED ◄── todos los estados (excepto cuando ya está ARCHIVED)                     │
```

Reglas:
- `CANCELLED` permitido desde `DRAFT|OPEN|CLOSED|READY_TO_SHIP|IN_PROGRESS`. NO permitido desde `FINISHED` ni `ARCHIVED`.
- `ARCHIVED` permitido desde cualquier estado salvo `CANCELLED` (terminal).
- Transiciones a sí mismo: no-op (idempotente, no emite evento).

Implementación de la regla pura: `apps/api/src/tournaments/domain/rules/status-transitions.rules.ts`.

## Endpoints

Todos van con prefijo global `/api/v1/`.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | `/api/v1/tournaments` | admin | Crear torneo |
| GET    | `/api/v1/tournaments` | public | Listar torneos (paginado, filtros: `status`, `publishedOnly`) |
| GET    | `/api/v1/tournaments/by-slug/:slug` | public | Detalle por slug |
| GET    | `/api/v1/tournaments/by-slug/:tournamentSlug/categories/:categorySlug` | public | Categoría por slug (delegado a CategoriesService) |
| GET    | `/api/v1/tournaments/:id` | public | Detalle por id |
| PATCH  | `/api/v1/tournaments/:id` | admin | Actualizar |
| PATCH  | `/api/v1/tournaments/:id/status` | admin | Cambiar estado |
| DELETE | `/api/v1/tournaments/:id` | admin | Soft-delete |
| GET    | `/api/v1/tournaments/:tournamentId/pricing` | public | Listar períodos de precio |
| GET    | `/api/v1/tournaments/:tournamentId/pricing/current` | public | Precio vigente al momento actual |
| POST   | `/api/v1/tournaments/:tournamentId/pricing` | admin | Crear período |
| PATCH  | `/api/v1/tournaments/:tournamentId/pricing/:pricingId` | admin | Editar período |
| DELETE | `/api/v1/tournaments/:tournamentId/pricing/:pricingId` | admin | Eliminar período |
| GET    | `/api/v1/sports/:sportIdOrCode/rules` | public | Reglas públicas del deporte; opcional `?modality=5v5` |

### POST /api/v1/tournaments

- **Auth**: `admin`.
- **Request body** (subset relevante):
  ```ts
  {
    name: string;
    description?: string;
    sportId: string;        // UUID de Sport
    status?: TournamentStatus; // default DRAFT
    fixtureFormat?: 'SINGLE_ROUND' | 'DOUBLE_ROUND'; // default SINGLE_ROUND
    modality?: '3v3' | '5v5';
    startDate?: string;     // ISO date
    endDate?: string;
    registrationStartDate?: string;
    registrationEndDate?: string;
    teamOperationsOpenAt?: string;
    teamOperationsCloseAt?: string;
    insurancePerPlayer?: number;
    promotionPlayoffFormat?: 'BO1' | 'BO3' | 'BO5'; // RN-058, default BO1
    earlyCancellationThresholdHours?: number;        // DP-013
  }
  ```
- **Response 201**: torneo creado con includes `sport`, `categories`, `_count`.
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | Body inválido (Zod) |
  | 400 | TOURNAMENT_INVALID_MODALITY | Combinación (sport, modality) no soportada |
  | 400 | (BadRequest, sin code) | Ventanas de fechas inválidas (start > end) |
  | 404 | NOT_FOUND | `sportId` no existe |
- **RN aplicadas**: RN-043, RN-046, RN-058.

### PATCH /api/v1/tournaments/:id

- **Auth**: `admin`.
- **Request body**: subset parcial de los campos de creación.
- **Errores**: las mismas que POST + `TOURNAMENT_INVALID_STATUS_TRANSITION` si se intenta saltar de estado.
- **Eventos disparados**: si cambia `status`, emite `tournament.status.changed`.

### PATCH /api/v1/tournaments/:id/status

- **Auth**: `admin`.
- **Request body**: `{ status: TournamentStatus }`.
- **Errores**: `TOURNAMENT_INVALID_STATUS_TRANSITION` con `details.allowedTransitions`.
- **Eventos**: `tournament.status.changed { tournamentId, fromStatus, toStatus }`.

### GET /api/v1/tournaments

- **Auth**: público.
- **Query**: `page`, `limit`, `sortBy`, `sortOrder`, `status`, `publishedOnly` (`true|1`).
- `publishedOnly=true` filtra a torneos con al menos 1 `Registration` con `status === 'approved'` (RN-018).

### POST /api/v1/tournaments/:tournamentId/pricing

- **Auth**: `admin`.
- **Request body**:
  ```ts
  {
    validFrom: string;     // ISO datetime
    validTo: string;       // ISO datetime, > validFrom
    entryFeeAmount: number;// >= 0
    currency?: string;     // 3-letter code, default ARS
  }
  ```
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | `validFrom >= validTo` |
  | 404 | NOT_FOUND | El torneo no existe |
  | 409 | PRICING_PERIOD_OVERLAP | El nuevo período se solapa con uno existente |

### GET /api/v1/tournaments/:tournamentId/pricing/current

- **Auth**: público.
- **Response**: `PricingPeriodResponse | null`.

### GET /api/v1/sports/:sportIdOrCode/rules

- **Auth**: público.
- **Query**: `modality` (opcional).
- **Response sin modality**: array de `SportRulesPublic` para todas las modalidades del deporte.
- **Response con modality**: objeto único `SportRulesPublic`.
- **Errores**: 404 `SPORT_RULES_NOT_FOUND` si el sport no existe; 400 `TOURNAMENT_INVALID_MODALITY` si la modalidad no tiene strategy.

## Casos especiales

- **No-op de status**: si `newStatus === currentStatus`, el use-case retorna el torneo sin actualizar ni emitir evento. Esto permite que clientes que envían el estado actual (UI optimista) no generen ruido.
- **Estados terminales**: `ARCHIVED` y `CANCELLED` no permiten transiciones salientes. Cualquier intento devuelve `TOURNAMENT_INVALID_STATUS_TRANSITION` con `allowedTransitions: []`.
- **Auto-transiciones por fecha**: `applyAutomaticStatusTransitions` corre en cada `findAll`/`findOne`/`findBySlug` y mueve automáticamente:
  - `OPEN` → `CLOSED` cuando `registrationEndDate <= now`.
  - `CLOSED|READY_TO_SHIP` → `FINISHED` cuando `endDate <= now`.
  Estas auto-transiciones NO emiten `tournament.status.changed` (decisión: son housekeeping, no acciones del usuario). Si se necesita el evento, se puede mover el cron a un job dedicado en una próxima iteración.
- **Pricing rangos cerrados**: `[validFrom, validTo]` es inclusivo en ambos extremos; dos períodos consecutivos deben dejar al menos 1 ms de gap (en la práctica, basta con poner el siguiente `validFrom` un día después).

## Eventos del dominio

Eventos que esta feature **emite**:
- `tournament.status.changed` — payload `{ tournamentId, fromStatus, toStatus }`.

Eventos que esta feature **escucha**:
- (ninguno por ahora — los listeners de notificación ante cambio de estado serán parte de W3.4).

## Errores específicos

Códigos agregados a `ErrorCode` por esta feature:
- `TOURNAMENT_INVALID_MODALITY` (ya existía en PR0): combinación sport+modality sin strategy.
- `TOURNAMENT_INVALID_STATUS_TRANSITION` (ya existía en PR0): salto de estado no permitido.
- `TOURNAMENT_NOT_FOUND` (nuevo): conveniencia para casos puntuales — actualmente la mayoría de paths usan `NOT_FOUND` genérico vía `BusinessError`.
- `PRICING_PERIOD_OVERLAP` (nuevo): solapamiento al crear/editar.
- `PRICING_PERIOD_NOT_FOUND` (nuevo): pricing id inexistente al editar/borrar.

Sincronizados a `packages/shared/src/errors/error-codes.ts` para consumo del FE.

## Pendientes / TODOs

- **DP-013** (`earlyCancellationThresholdHours`): el campo se acepta y persiste, pero no se consume todavía. Cuando se cierre la decisión de RN-052, el módulo `Matches` (W3.1) lo leerá del torneo para validar reprogramaciones sin penalidad. En código:
  - `tournaments.service.ts` lo persiste tal cual.
  - No hay TODOs en línea — el campo está documentado y queda esperando consumidor.
- **RN-048 — diferenciación por método de pago**: la RN menciona que el precio puede variar también por **tipo de pago** (efectivo, transferencia, tarjeta). El modelo `TournamentRegistrationPricing` actual no tiene esa dimensión. Si W2.3 (Pricing & Discounts) la requiere, se sumará una columna o tabla auxiliar. Por ahora el período sólo varía por fecha. Marcado como TODO conjunto con W2.3.
- **DP-001** (default BO format por modalidad): no afecta este worktree directamente — el default `BO1` para `promotionPlayoffFormat` es razonable mientras la decisión esté abierta. La aplicación efectiva del repechaje vive en W3.1.

## Arquitectura interna

```
apps/api/src/tournaments/
├── domain/
│   └── rules/
│       ├── status-transitions.rules.ts        # listAllowedTransitions, isValidStatusTransition
│       ├── pricing-overlap.rules.ts           # periodsOverlap, findOverlappingPeriod, pickCurrentPeriod
│       └── date-windows.rules.ts              # validateTournamentWindows
├── application/
│   ├── ports/
│   │   ├── tournament-repository.port.ts      # ITournamentRepository + TOURNAMENT_REPOSITORY token
│   │   └── pricing-repository.port.ts         # IPricingRepository + PRICING_REPOSITORY token
│   └── use-cases/
│       ├── validate-modality.use-case.ts
│       ├── change-status.use-case.ts
│       ├── list-pricing-periods.use-case.ts
│       ├── get-current-pricing.use-case.ts
│       ├── create-pricing-period.use-case.ts
│       ├── update-pricing-period.use-case.ts
│       ├── delete-pricing-period.use-case.ts
│       └── get-sport-rules-public.use-case.ts
├── infrastructure/
│   └── repositories/
│       ├── prisma-tournament.repository.ts
│       └── prisma-pricing.repository.ts
├── presentation/
│   ├── controllers/
│   │   ├── tournament-pricing.controller.ts
│   │   └── sport-rules.controller.ts
│   ├── dto/pricing.dto.ts
│   └── mappers/pricing.mapper.ts
├── tournaments.controller.ts                  # legacy — TODO migrar a presentation/controllers
├── tournaments.service.ts                     # facade que llama use-cases + queries Prisma directas
├── tournaments.module.ts                      # wiring
├── categories/                                # owned by W1.2
└── zones/                                     # owned by W1.2
```

`TournamentsController` y `TournamentsService` (legacy) se conservan para no romper el contrato del FE existente. Internamente delegan al `ChangeTournamentStatusUseCase` y al `ValidateModalityUseCase`. La migración total a use-cases por endpoint queda como follow-up — los nuevos endpoints (pricing, sport-rules) ya nacen en `presentation/controllers/`.
