# Feature: Pricing & Discounts

> Estado: completado en W2.3 (`feat/api/pricing`).
>
> Esta feature contiene:
> - Períodos de pricing por torneo + dimensión "método de pago" (RN-048).
> - Descuentos manuales aplicados a equipos (RN-020).
> - Stub admin del descuento por franquicia (RN-012, bloqueado por DP-011).
>
> El CRUD básico de `TournamentRegistrationPricing` lo había dejado W1.1; W2.3
> retoma esos endpoints en un módulo nuevo (`apps/api/src/pricing/`) y suma
> la dimensión `paymentMethod`.

## Casos de uso

1. **Listar períodos de pricing del torneo (público)** — opcional `?method=cash|transfer|card` para filtrar.
2. **Consultar pricing vigente (público)** — `GET /api/v1/tournaments/:id/pricing/current?method=...` devuelve el período aplicable a `(método, ahora)` o `null`.
3. **Crear período de pricing (admin)** — `POST /api/v1/tournaments/:id/pricing` con `paymentMethod` opcional. Valida que no haya conflicto con períodos existentes.
4. **Editar período (admin)** — cambia fechas, monto, currency o método; revalida overlap.
5. **Eliminar período (admin)** — soft hace `delete()` simple; el modelo no tiene `deletedAt` aquí.
6. **Computar fee de inscripción aplicable (interno)** — `PricingService.computeRegistrationFee` lo consume W2.2 (PaymentsService).
7. **Aplicar descuento manual (admin)** — `POST /api/v1/discounts` crea una `Debt` con `metadata.kind=DISCOUNT` y monto negativo. Emite `DEBT_CREATED`.
8. **Listar descuentos (admin)** — `GET /api/v1/discounts?teamId=...&includeCancelled=true|false`.
9. **Cancelar descuento (admin)** — `DELETE /api/v1/discounts/:id` marca la `Debt` como `CANCELLED` + audit.
10. **Disparar descuento por franquicia (admin)** — `POST /api/v1/franchises/:id/apply-discounts` retorna `501` mientras DP-011 esté abierta.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-020 | Descuentos manuales (admin) | docs/business-rules/pricing.md |
| RN-021 | Tarifas configurables sin código | docs/business-rules/pricing.md |
| RN-048 | Pricing variable por período × método de pago | docs/business-rules/pricing.md |
| RN-012 | Descuento por franquicia (stub, DP-011 abierta) | docs/business-rules/franchises.md |

## Modelo

### TournamentRegistrationPricing (RN-048)

- **Tabla**: `tournament_registration_pricing` (sin cambios respecto a PR0/W1.1).
- **Schema columnar**: `id, tournamentId, validFrom, validTo, entryFeeAmount, currency, createdAt, updatedAt`.
- **Decisión de modelado** (W2.3): la dimensión `paymentMethod` (`cash` | `transfer` | `card` | `null`) se persiste codificada dentro de `currency` con la convención `"<CCY>"` (sin método, default) o `"<CCY>:<method>"`. El repositorio se encarga del encode/decode transparente; los use-cases ven `paymentMethod` como un campo independiente del `PricingRecord`.
- **Justificación**: PR0 quedó cerrado y la regla del worktree es "NO modificar `schema.prisma`". Esta solución cubre el requisito de RN-048 sin migración de schema.
- **Filas legacy**: rows preexistentes con `currency='ARS'` (sin sufijo) quedan automáticamente como `paymentMethod=null` (aplica a todos los métodos).
- **TODO schema-v2** — cuando se abra una migración Prisma, mover `paymentMethod` a una columna dedicada (`paymentMethod String?` con check enum). Búsqueda en código: `// TODO: schema-v2 — paymentMethod columnar`.

### Discount (RN-020)

- **Tabla**: `debts` (modelo `Debt`, sin cambios respecto a PR0).
- **Convención**: `type=OTHER_MANUAL`, `metadata.kind='DISCOUNT'`, `originAmount` y `currentBalance` **negativos** (representan crédito a favor del equipo).
- **Por qué**: el modelo `Debt` ya soporta historial, audit y cancelación. Un descuento es conceptualmente una deuda con signo invertido — sumar todas las debts no canceladas da el saldo neto del equipo.
- **`parentDebtId`**: si el admin aplica el descuento sobre una deuda específica (ej. para neutralizar un cargo), se setea `sourceDebtId` que el repo guarda en `parentDebtId`.

### Estados del descuento

```
APPROVED ──(cancel)──> CANCELLED
```

Se reutiliza el enum `DebtStatus`. Los descuentos no transicionan a `PAID` (su saldo es negativo). El estado `APPROVED` significa "activo".

## Endpoints

Todos van con prefijo global `/api/v1/`.

### Pricing periods

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET    | `/api/v1/tournaments/:tournamentId/pricing` | public | Listar períodos. Filtra por `?method=` (no incluye fallback null) |
| GET    | `/api/v1/tournaments/:tournamentId/pricing/current` | public | Pricing aplicable ahora. `?method=` prioriza match exacto y cae al fallback |
| POST   | `/api/v1/tournaments/:tournamentId/pricing` | admin | Crear período (con `paymentMethod` opcional) |
| PATCH  | `/api/v1/tournaments/:tournamentId/pricing/:pricingId` | admin | Editar |
| DELETE | `/api/v1/tournaments/:tournamentId/pricing/:pricingId` | admin | Eliminar |

### Descuentos manuales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | `/api/v1/discounts` | admin | Aplicar descuento manual a un equipo |
| GET    | `/api/v1/discounts` | admin | Listar; filtros `?teamId=` y `?includeCancelled=true` |
| DELETE | `/api/v1/discounts/:id` | admin | Cancelar (status=CANCELLED + audit) |

### Descuento por franquicia (stub)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | `/api/v1/franchises/:franchiseId/apply-discounts` | admin | **STUB** — retorna 501 (`FRANCHISE_DISCOUNT_NOT_IMPLEMENTED`) hasta cerrar DP-011 |

### POST /api/v1/tournaments/:tournamentId/pricing

- **Auth**: `admin`.
- **Request body**:
  ```ts
  {
    validFrom: string;     // ISO datetime
    validTo: string;       // ISO datetime, > validFrom
    entryFeeAmount: number;// >= 0
    currency?: string;     // 3-letter ISO, default ARS
    paymentMethod?: 'cash' | 'transfer' | 'card' | null;
  }
  ```
- **Response 201**: `PricingPeriodResponse` (incluye `paymentMethod`).
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | `validFrom >= validTo` |
  | 404 | NOT_FOUND | Torneo no existe |
  | 409 | PRICING_PERIOD_OVERLAP | Conflicto en `(rango × método)` |
- **RN aplicadas**: RN-048, RN-021.

### POST /api/v1/discounts

- **Auth**: `admin`.
- **Request body**:
  ```ts
  {
    teamId: string;       // UUID
    amount: number;       // POSITIVO; el repo lo persiste negativo en Debt
    currency?: string;
    concept: string;      // descripción visible
    notes?: string;
    metadata?: Record<string, unknown>;
    sourceDebtId?: string; // si aplica contra una deuda concreta → parentDebtId
  }
  ```
- **Response 201**: `DiscountResponse` con `amount` positivo (display).
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | DISCOUNT_AMOUNT_INVALID | <= 0, > 10M, > 2 decimales, NaN |
  | 400 | VALIDATION_FAILED | Body inválido (Zod) |
- **Eventos**: emite `DomainEvent.DEBT_CREATED` con payload incluyendo el `debtId` y el `amount` positivo (display).

### POST /api/v1/franchises/:franchiseId/apply-discounts

- **Auth**: `admin`.
- **Estado**: STUB.
- **Response**: `501` con `code=FRANCHISE_DISCOUNT_NOT_IMPLEMENTED` y `details.decision='DP-011'`.
- **TODO**: cerrar DP-011 (valor de N y X) y luego implementar el use-case real (ver bloque "Pendientes" abajo).

## Casos especiales

- **Match exacto vs fallback (RN-048)**: `pickApplicablePeriod` siempre prioriza el período con `paymentMethod` igual al solicitado; si no encuentra, cae al período con `paymentMethod=null` (cobertura general). Si tampoco existe → `null` / `PRICING_NOT_CONFIGURED`.
- **Overlap considerando método**: dos períodos con métodos distintos NO se consideran en conflicto aunque sus rangos solapen. Un período `null` SÍ entra en conflicto con cualquier método específico en el mismo rango (sería ambiguo).
- **`computeRegistrationFee` con falta de pricing**: lanza `BusinessError(PRICING_NOT_CONFIGURED, HTTP 422)` con `details.{tournamentId, paymentMethod, registrationDate}`. El consumidor (W2.2) debe propagar.
- **Encoding del currency**: filas con currency `"ARS"` o `"USD"` siguen siendo válidas y se interpretan como `paymentMethod=null`. Sólo se diferencian por método las que tienen sufijo (`"ARS:cash"`, etc.). El admin nunca ingresa el sufijo manualmente — viaja como campo separado en los DTOs.
- **Cancel de descuento**: usa una transacción Prisma para escribir `Debt.status=CANCELLED` + insertar `DebtAudit` con motivo. Si el módulo Debts (W2.1) define listeners adicionales, los toma del evento `debt.cancelled` (NO emitido por este módulo en v1; es responsabilidad de W2.1 si lo necesita — ver "Eventos del dominio").
- **Idempotencia**: `applyDiscount` no chequea duplicados; un admin puede aplicar varios descuentos al mismo equipo y todos suman.

## Eventos del dominio

Eventos que esta feature **emite**:
- `DomainEvent.DEBT_CREATED` — con payload `{ debtId, type='OTHER_MANUAL', amount: positive, teamId, profileId? }`. Listeners interesados pueden filtrar por `type==='OTHER_MANUAL'` (combinado con leer `metadata.kind='DISCOUNT'` desde la DB) si quieren reaccionar específicamente a descuentos.

Eventos que esta feature **escucha**:
- (ninguno por ahora — el cómputo `pickApplicablePeriod` se hace on-demand).

## Errores específicos

Códigos agregados a `ErrorCode` por esta feature:
- `PRICING_NOT_CONFIGURED` — `computeRegistrationFee` no encontró pricing aplicable.
- `PRICING_INVALID_PAYMENT_METHOD` — query string `?method=` con valor desconocido.
- `DISCOUNT_NOT_FOUND` — id no existe o no es un descuento (no tiene `metadata.kind='DISCOUNT'`).
- `DISCOUNT_AMOUNT_INVALID` — monto <= 0, > 10M, > 2 decimales o NaN/Infinity.
- `DISCOUNT_ALREADY_CANCELLED` — descuento ya estaba `CANCELLED`.
- `FRANCHISE_DISCOUNT_NOT_IMPLEMENTED` — `apply-discounts` con DP-011 abierta.

Sincronizados a `packages/shared/src/errors/error-codes.ts` para consumo del FE.

## Pendientes / TODOs

### DP-011 — Descuento por franquicia (RN-012)

**Estado**: bloqueada. Ver `docs/pending-decisions.md`.

Contrato esperado para cuando se cierre DP-011:

```ts
// ApplyFranchiseDiscountsUseCase.execute
// Inputs:
//   - franchiseId
//   - triggeredByProfileId (admin que dispara)
// Pseudocódigo:
//   1. Listar inscripciones aprobadas de la franquicia (sumando todos sus equipos).
//   2. count = inscripciones.length
//   3. Si count < N (a definir) → return { applied: 0, reason: 'BELOW_THRESHOLD' }
//   4. Para cada equipo elegible:
//        - amount = X (% de la fee del torneo, o monto fijo) — depende del cierre.
//        - Si "por equipo" → 1 ApplyDiscountUseCase por equipo con concept claro.
//        - Si "agregado" → 1 sólo descuento sobre el equipo "principal" o split.
//   5. Devuelve `{ applied: <n>, totalAmount, perTeam: [...] }`.
```

Hasta que se defina, el endpoint admin `POST /api/v1/franchises/:id/apply-discounts` retorna 501.

### Schema v2 — paymentMethod columnar

El encoding `currency:method` cubre RN-048 sin migración pero tiene limitaciones (no es queryable como columna independiente, no hay enum check en BD). Cuando se abra una migración de schema, se debe:

1. Agregar columna `paymentMethod String?` a `TournamentRegistrationPricing`.
2. Migración de datos: parsear filas existentes y dividir `currency` en (`currency`, `paymentMethod`).
3. Eliminar `encodeCurrency`/`decodeCurrency` del repositorio.
4. Sumar índice `(tournamentId, paymentMethod, validFrom)`.

Buscar `// TODO: schema-v2 — paymentMethod columnar` en código.

## Arquitectura interna

```
apps/api/src/pricing/
├── domain/
│   └── rules/
│       ├── payment-method.rules.ts            # PaymentMethod, encode/decode, methodsOverlap
│       ├── pricing-overlap-with-method.rules.ts # findConflictingPeriod, pickApplicablePeriod
│       └── discount-amount.rules.ts           # validateDiscountAmount, sign helpers, isDiscountMetadata
├── application/
│   ├── ports/
│   │   ├── pricing-repository.port.ts         # IPricingRepository + PRICING_REPOSITORY token
│   │   ├── tournament-lookup.port.ts          # ITournamentLookupPort + TOURNAMENT_LOOKUP_PORT token
│   │   └── discount-repository.port.ts        # IDiscountRepository + DISCOUNT_REPOSITORY token
│   ├── services/
│   │   └── pricing.service.ts                 # FACADE público (export del módulo)
│   └── use-cases/
│       ├── create-pricing-period.use-case.ts
│       ├── update-pricing-period.use-case.ts
│       ├── delete-pricing-period.use-case.ts
│       ├── list-pricing-periods.use-case.ts
│       ├── get-current-pricing.use-case.ts
│       ├── compute-registration-fee.use-case.ts (consumido por W2.2)
│       ├── apply-discount.use-case.ts
│       ├── list-discounts.use-case.ts
│       ├── cancel-discount.use-case.ts
│       └── apply-franchise-discounts.use-case.ts (STUB DP-011)
├── infrastructure/
│   └── repositories/
│       ├── prisma-pricing.repository.ts        # encode/decode currency:method
│       ├── prisma-tournament-lookup.repository.ts
│       └── prisma-discount.repository.ts       # Debt + metadata.kind=DISCOUNT
├── presentation/
│   ├── controllers/
│   │   ├── tournament-pricing.controller.ts    # /api/v1/tournaments/:id/pricing
│   │   ├── discounts.controller.ts             # /api/v1/discounts
│   │   └── franchise-discounts.controller.ts   # /api/v1/franchises/:id/apply-discounts (STUB)
│   ├── dto/
│   │   ├── pricing.dto.ts
│   │   └── discount.dto.ts
│   └── mappers/
│       ├── pricing.mapper.ts
│       └── discount.mapper.ts
└── pricing.module.ts                           # exporta PricingService
```

`TournamentsModule` (W1.1) deja de registrar el controller de pricing y los use-cases viejos; `PricingModule` toma esa responsabilidad. URLs no cambian.

`PaymentsModule` (W2.2) inyecta `PricingService` cuando esté listo y llama:

```ts
const { amount, currency, period } = await this.pricingService.computeRegistrationFee({
  tournamentId,
  paymentMethod: paymentInput.method,
  registrationDate: registration.requestedAt,
});
```

para resolver el monto base sobre el cual aplicar descuentos manuales (sumando `Debt.currentBalance` negativos del equipo).
