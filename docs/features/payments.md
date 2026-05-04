# Feature: payments

> Estado: completado en W2.2 (`feat/api/payments-completion`).
>
> Esta feature contiene:
> - Refactor del módulo Payments preexistente a clean architecture (b).
> - Migración del modelo `Payment` para apuntar a `Debt` (W2.1) — campo `debtId` primario, `registrationId`/`matchId` legacy.
> - Listener `PAYMENT_APPROVED` que programa el borrado del comprobante de transferencia (RN-060) — implementación del contrato que dejó pendiente W2.1.
> - Endpoint de subida de comprobante (RN-014) con `MediaAsset`.
> - `RegistrationPaymentsService` (puerto exportado): crea entry-fee + insurance debts (RN-013/-015/-017), expone estado consolidado de pago de la inscripción (RN-015/-016).

## Casos de uso

1. **Crear checkout de MercadoPago (FE primario)** — `POST /api/v1/payments/checkout` con `type=debt|registration|match`. Devuelve `checkoutUrl`. El monto sale de `Debt.currentBalance` cuando `type=debt`. Conserva los paths legacy (`registration`/`match`) para no romper al FE actual.
2. **Polling de estado de pago** — `GET /api/v1/payments/:id/status`. El FE consulta cada 2-3s hasta que `statusInfo.isTerminal=true`.
3. **Crear pago manual (interno)** — `POST /api/v1/payments`. Body acepta `debtId` (preferido) o legacy `registrationId/matchId`.
4. **Listar pagos (admin)** — `GET /api/v1/payments?status&method&debtId&registrationId&matchId`.
5. **Resumen de pagos (admin)** — `GET /api/v1/payments/summary`.
6. **Mis pagos** — `GET /api/v1/payments/me`.
7. **Detalle** — `GET /api/v1/payments/:id`.
8. **Marcar pagado (admin)** — `POST /api/v1/payments/:id/mark-paid`. Si tiene `debtId` invoca `DebtsService.applyPayment`. Emite `PAYMENT_APPROVED`.
9. **Marcar fallido (admin)** — `POST /api/v1/payments/:id/mark-failed`. Emite `PAYMENT_REJECTED`.
10. **Subir comprobante (RN-014)** — `POST /api/v1/payments/:id/proof` (multipart `file`). Crea `MediaAsset` PRIVATE en `payment-proofs/${paymentId}/`.
11. **Re-crear preferencia MP (legacy)** — `POST /api/v1/payments/:id/mercadopago/preference`.
12. **Webhook MP** — `POST /api/v1/payments/webhooks/mercadopago` (Public). Si MP aprueba, llama `applyPayment` y emite `PAYMENT_APPROVED`.
13. **Estado consolidado de pago de inscripción (RN-015/-016)** — `GET /api/v1/registrations/:id/payment-status`.
14. **(Port interno)** `RegistrationPaymentsService.createRegistrationDebts(registrationId)` — el futuro `RegistrationsService` lo invoca al aprobar la postulación: crea `REGISTRATION_FEE` (1) + `INSURANCE` por jugador, salvo reuso (RN-017).

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-013 | Aprobación de postulación por admin | docs/business-rules/enrollments.md |
| RN-014 | Comprobante requerido en la postulación | docs/business-rules/enrollments.md |
| RN-015 | Inscripción oficial requiere ambos pagos | docs/business-rules/enrollments.md |
| RN-016 | Plaza asegurada sin poder jugar | docs/business-rules/enrollments.md |
| RN-017 | Reutilización de seguro ya pagado | docs/business-rules/enrollments.md |
| RN-022 | Seña amistoso (FRIENDLY_DEPOSIT) | docs/business-rules/friendlies.md |
| RN-060 | Auto-borrado de comprobante de transferencia | docs/business-rules/payments.md |

## Modelo

### Entidad principal — Payment

- **Tabla**: `payments` (sin cambios respecto a PR0).
- **Campos relevantes**:
  - `debtId` (string?, **PR0**): nuevo apuntador primario al modelo `Debt`. Cualquier nuevo pago debe usar este campo.
  - `registrationId` / `matchId` (string?, legacy): se mantienen para histórico — no se actualizan desde W2.2.
  - `profileId` (string): quien dispara el pago (delegado / user que crea el checkout / admin).
  - `amount` (Float, **schema-v1 limitation**): el dominio internamente trabaja con `Prisma.Decimal`.
  - `method` (string): `mercadopago` | `cash` | `transferencia` | `transfer` (alias) | `other`.
  - `status` (string): `pendiente` | `procesando` | `procesado` | `fallido` | `reembolsado`.
  - `providerPaymentId` / `providerResponse`: data del proveedor (MP).
  - `processedAt` (Date?): timestamp de aprobación.

### Estados y transiciones

```
pendiente   → procesando | procesado | fallido
procesando  → procesado | fallido
procesado   → reembolsado            (refund admin / MP)
fallido     → (terminal)
reembolsado → (terminal)
```

- `procesado` es el único estado que dispara `applyPayment` sobre la `Debt` y emite `PAYMENT_APPROVED`.
- Las transiciones a `procesado`/`fallido` requieren admin (cuando el método ≠ MP) o webhook (MP).
- `markAsPaid` rechaza pagos `mercadopago` (vía error `PAYMENT_METHOD_INVALID`) — esos los aprueba el webhook.

### Comprobantes (RN-014/-060)

- Subida via `POST /:id/proof` (multipart). Validaciones:
  - Método del pago ∈ `transferencia | transfer`.
  - Status ∉ `procesado | fallido | reembolsado`.
  - ContentType ∈ `application/pdf | image/png | image/jpeg | image/webp`.
  - Tamaño ≤ 10MB.
- El asset se guarda en bucket `private` con `category=PAYMENT_PROOF`, `metadata.paymentId` y `pathPrefix=payment-proofs/${paymentId}`.
- Cuando `PAYMENT_APPROVED` se emite con `method='transferencia'`, el listener `PaymentApprovedListener` busca el último asset y llama `MediaAssetService.scheduleDeletion(assetId, now+3d)`. El cron `DeleteScheduledPaymentProofsJob` (W2.1) hace el borrado físico.

## Endpoints

Tabla resumen:

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/v1/payments/checkout | auth | Crear checkout MP (debt | registration | match) |
| GET | /api/v1/payments/:id/status | auth | Polling de estado |
| POST | /api/v1/payments | auth | Crear pago manual |
| GET | /api/v1/payments | admin | Listar |
| GET | /api/v1/payments/summary | admin | Resumen |
| GET | /api/v1/payments/me | auth | Mis pagos |
| GET | /api/v1/payments/:id | auth | Detalle |
| POST | /api/v1/payments/:id/mark-paid | admin | Aprobar (efectivo/transferencia) |
| POST | /api/v1/payments/:id/mark-failed | admin | Marcar fallido |
| POST | /api/v1/payments/:id/proof | auth | Subir comprobante (multipart) |
| POST | /api/v1/payments/:id/mercadopago/preference | auth | Re-crear preference MP |
| GET | /api/v1/payments/mercadopago/status | auth | ¿MP habilitado? |
| POST | /api/v1/payments/webhooks/mercadopago | Public | Webhook MP |
| GET | /api/v1/registrations/:id/payment-status | auth | Estado consolidado de la inscripción |

### POST /api/v1/payments/checkout

- **Auth**: usuario autenticado (delegado del equipo).
- **Body**:
  ```ts
  {
    type: 'debt' | 'registration' | 'match',
    debtId?: string,         // requerido si type=debt (preferido)
    registrationId?: string,  // requerido si type=registration
    matchId?: string,         // requerido si type=match
  }
  ```
- **Response 201**: `{ paymentId, checkoutUrl, sandboxUrl?, preferenceId, amount, currency, expiresAt }`.
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | Body inválido / falta debtId/registrationId/matchId / monto ≤ 0 |
  | 404 | NOT_FOUND | Profile / Debt / Registration / Match no existen |
  | 409 | DEBT_ALREADY_PAID | La debt ya está saldada |
  | 409 | DEBT_INVALID_STATUS_TRANSITION | Debt en estado no pagable |
  | 409 | CONFLICT | Inscripción ya pagada (legacy) |
  | 502 | CONFLICT | MercadoPago error al crear preference |
  | 503 | CONFLICT | MercadoPago deshabilitado |
- **RN aplicadas**: RN-013 (entry/insurance), RN-022 (FRIENDLY_DEPOSIT).
- **Eventos disparados**: `PAYMENT_CREATED`.

### POST /api/v1/payments/:id/mark-paid

- **Auth**: `admin`/`master`.
- **Body**: `{ externalReference?: string, notes?: string }`.
- **Comportamiento**:
  - Verifica método ≠ `mercadopago`.
  - Estado debe ser `pendiente` o `procesando`.
  - Actualiza Payment a `procesado` con `processedAt=now`.
  - Si `payment.debtId`: llama `DebtsService.applyPayment({ debtId, amount, paidByProfileId: adminId })`.
  - Si solo `registrationId` (legacy): marca `Registration.status='pagada'`.
  - Emite `PAYMENT_APPROVED`.
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | PAYMENT_METHOD_INVALID | método inválido o `mercadopago` |
  | 404 | NOT_FOUND | pago no existe |
  | 409 | CONFLICT | pago ya procesado/fallido/reembolsado |

### POST /api/v1/payments/:id/proof

- **Auth**: usuario autenticado.
- **Content-Type**: `multipart/form-data`, campo `file`.
- **Restricciones**:
  - Método debe ser `transferencia` (o alias `transfer`).
  - Pago no debe estar en estado terminal.
  - Tipos: `application/pdf | image/png | image/jpeg | image/webp`.
  - Tamaño ≤ 10MB.
- **Response 201**: `{ assetId, paymentId, contentType, originalFilename, sizeBytes, uploadedAt }`.
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | PAYMENT_PROOF_REQUIRED | archivo vacío |
  | 400 | PAYMENT_METHOD_INVALID | el método no requiere comprobante |
  | 409 | CONFLICT | pago en estado terminal |
  | 413 | VALIDATION_FAILED | tamaño excedido |
  | 415 | VALIDATION_FAILED | tipo no permitido |

### GET /api/v1/registrations/:id/payment-status

- **Auth**: cualquiera autenticado (pensado para delegado del equipo y admin).
- **Response 200**:
  ```ts
  {
    registrationId: string,
    entryFeePaid: boolean,
    entryFeeDebtId?: string,
    entryFeeBalance?: number,
    insurances: { profileId, paid, reused, debtId? }[],
    insurancesPaid: boolean,
    status: 'PENDING_BOTH' | 'PENDING_ENTRY' | 'PLAZA_ASEGURADA' | 'PENDING_INSURANCES' | 'OFICIAL'
  }
  ```
- **Mapeo de estado**:
  - `PENDING_BOTH` — no hay debts o ninguna pagada.
  - `PLAZA_ASEGURADA` (RN-016) — entry fee pagada, falta al menos un seguro.
  - `OFICIAL` (RN-015) — todo pagado.
  - `PENDING_ENTRY` — caso edge: insurances pagas pero entry no.
- **RN aplicadas**: RN-015, RN-016.

## Casos especiales

- **Reuso de comprobante de pago pendiente**: `CreateCheckoutUseCase` consulta `findActiveForResource` y reusa si hay un Payment `pendiente|procesando` reciente (< 23h) para el mismo `(debtId|registrationId|matchId)`. Evita duplicar preferences cuando el FE refresca la pantalla.
- **Money handling**: `Payment.amount` es `Float` en el schema (no `Decimal`). El dominio convierte a `Prisma.Decimal` en runtime para comparar con `Debt.currentBalance` y volver a `number` solo al persistir. La pérdida de precisión queda contenida en el casting.
- **Webhook idempotencia**: el adapter MP busca el Payment por `external_reference` (que es nuestro `payment.id`), no por providerPaymentId. Múltiples webhooks de MP sobre el mismo Payment llegan al mismo handler; las transiciones inválidas las rechaza el dominio.
- **applyPayment best-effort en webhook/markAsPaid**: si la deuda está corrupta (ej. estado terminal) y `DebtsService.applyPayment` falla tras aprobar el Payment, NO bloqueamos al admin / al webhook. El Payment queda como `procesado` y la falla se loguea para intervención manual. Decisión consciente: priorizamos cerrar el ciclo de pago vs. atomicidad cross-módulo.
- **RN-017 reuso de seguro (v1 simple)**: `RegistrationPaymentsService.createRegistrationDebts` consulta `IDebtContextPort.hasReusableInsurance({ profileId, sportId, year })` que busca una `INSURANCE PAID` con `metadata.year === currentYear` y `metadata.sportId === sportId` para el `profileId`. Si encuentra, NO crea una nueva debt. **TODO**: cuando se cierre la decisión sobre `validUntil`/`coverageEndDate` (campos de cobertura del seguro), refinar la query para considerar la fecha del torneo destino.
- **Idempotencia de `createRegistrationDebts`**: si la registration ya tiene un `REGISTRATION_FEE` activo (no cancelado/borrado), se reusa sin recrear. Lo mismo para cada `INSURANCE` por profileId. Permite reintento seguro desde el caller.
- **Legacy fields en checkout**: cuando `type=debt` y la debt arrastra `registrationId`/`matchId`/`friendlyId`, los propagamos al Payment para que reportes legacy del FE (que aún muestran `registration`/`match` en `getPaymentStatus`) sigan vivos.

## Eventos del dominio

Eventos que esta feature **emite**:

- `payment.created` — payload `{ paymentId, debtId? }`. Se emite tras crear un Payment (manual o vía checkout MP).
- `payment.approved` — payload `{ paymentId, debtId?, approvedBy, method }`. Se emite cuando el pago pasa a `procesado` (markAsPaid o webhook MP `approved`).
- `payment.rejected` — payload `{ paymentId, reason? }`. Se emite en markAsFailed o webhook MP `rejected`/`cancelled`.

Eventos que esta feature **escucha** (de otras features):

- (ninguno externo). El módulo Friendlies (W1.4) escucha `PAYMENT_APPROVED` para confirmar señas de amistosos (RN-022) — el ciclo es: el delegado paga la seña vía `POST /payments/checkout` con `debtId` de tipo `FRIENDLY_DEPOSIT`, MP aprueba, emitimos `PAYMENT_APPROVED`, friendlies reacciona y marca el `Friendly` como `CONFIRMED` cuando ambas señas se pagaron.

Listeners internos:

- `PaymentApprovedListener` (RN-060) — implementa el contrato que dejó pendiente W2.1. Suscribe a `PAYMENT_APPROVED`, filtra `method=transferencia|transfer`, busca el último `MediaAsset` con `category=PAYMENT_PROOF` y `metadata.paymentId === paymentId`, llama `MediaAssetService.scheduleDeletion(assetId, now+3d)`.

## Errores específicos

Códigos usados (todos ya existían en `error-codes.ts`, no se sumaron códigos en este worktree):

- `PAYMENT_METHOD_INVALID` — método de pago no válido o no soportado para la operación (ej. markAsPaid en MP).
- `PAYMENT_PROOF_REQUIRED` — RN-014, archivo vacío al subir comprobante.
- `DEBT_ALREADY_PAID` — checkout/create-payment sobre deuda PAID.
- `DEBT_AMOUNT_EXCEEDS_BALANCE` — amount > Debt.currentBalance.
- `DEBT_INVALID_STATUS_TRANSITION` — checkout/create-payment sobre deuda en estado no activable.
- `VALIDATION_FAILED` — body inválido (zod), monto ≤ 0, tamaño/tipo de archivo.
- `NOT_FOUND` — payment/debt/registration/match/profile no encontrados.
- `CONFLICT` — pago en estado terminal, inscripción ya pagada (legacy), MP error.
- `UNAUTHORIZED` — firma de webhook inválida.

## Contrato de `RegistrationPaymentsService` (puerto exportado)

Para que el futuro `RegistrationsModule` (refinement) lo invoque al aprobar postulaciones:

```ts
@Injectable()
class RegistrationPaymentsService {
  /**
   * Crea las debts asociadas a una postulación aprobada.
   * - 1 REGISTRATION_FEE para el equipo (monto desde PricingService.computeRegistrationFee).
   * - 1 INSURANCE por jugador del roster (monto desde Tournament.insurancePerPlayer).
   *   RN-017: si el jugador ya tiene INSURANCE PAID del año, NO crea — `insuranceReusedFor` lista esos profileIds.
   * Idempotente: si las debts ya existen, las reusa.
   */
  createRegistrationDebts(input: {
    registrationId: string;
    createdByProfileId: string;
    entryFeeOverride?: number;     // útil para tests / migraciones
    dueInDays?: number;             // default 7
  }): Promise<{
    entryFeeDebtId: string;
    insuranceDebtIds: string[];
    insuranceReusedFor: string[];   // profileIds que reusaron seguro vigente
  }>;

  /**
   * Estado consolidado de pago de la inscripción (RN-015/-016).
   */
  getRegistrationPaymentStatus(registrationId: string): Promise<{
    registrationId: string;
    entryFeePaid: boolean;
    entryFeeDebtId?: string;
    entryFeeBalance?: number;
    insurances: { profileId; paid; reused; debtId? }[];
    insurancesPaid: boolean;
    status: 'PENDING_BOTH' | 'PENDING_ENTRY' | 'PLAZA_ASEGURADA' | 'PENDING_INSURANCES' | 'OFICIAL';
  }>;
}
```

Inyección: `import { RegistrationPaymentsService } from 'apps/api/src/payments/application/services/registration-payments.service'` y agregar `PaymentsModule` a `imports`.

## Pendientes / TODOs

### DP-016 — Número de comprobante como dato estructurado

**Estado**: bloqueada. Ver `docs/pending-decisions.md`.

Hoy guardamos el archivo y lo borramos a los 3 días (RN-060). Cuando se cierre DP-016 se debe:
- Sumar campo en `Payment` (probablemente `referenceNumber: string?` con índice).
- Endpoint admin para que el revisor ingrese el número al aprobar.
- Búsqueda por número desde el dashboard.

Buscar en código: `// TODO: DP-016 — número comprobante`.

### DP-017 — Seña de amistoso: ¿se descuenta del costo total?

**Estado**: bloqueada. Ver `docs/pending-decisions.md`.

Hoy la `FRIENDLY_DEPOSIT` debt es un cargo independiente. Cuando se cierre DP-017:
- Si es **anticipo**: al confirmarse el `Match` resultante, descontar `originAmount` del `MATCH_FEE` de cada equipo, o crear un descuento (`Debt OTHER_MANUAL` con monto negativo via PricingModule).
- Si es **cargo adicional**: dejar como está.

### RN-015/RN-017 — Lógica de validUntil del seguro

`hasReusableInsurance` chequea solo `metadata.year`. Cuando se decida cómo modelar la cobertura (calendar year, anniversary date, tournament-specific), refinar:
- Si el seguro tiene `validUntil`, comparar contra el `Tournament.endDate` destino.
- Si la cobertura es por tournament, no es reusable cross-tournament.

Buscar en código: `// TODO: RN-017 — coverageEndDate`.

### Migración progresiva del FE

Hoy el FE puede seguir mandando `type=registration|match` al `/checkout`. La migración recomendada:
1. Cuando admin aprueba postulación, `RegistrationsModule` (futuro worktree) llama `RegistrationPaymentsService.createRegistrationDebts`.
2. El FE dibuja `GET /registrations/:id/payment-status` y para cada debt pendiente abre `/payments/checkout` con `type=debt`, `debtId`.
3. Cuando todo el FE migró → deprecar `type=registration|match` (mantener por backward-compat).

### Atomicidad cross-módulo

`markAsPaid` y `webhook` aprueban el Payment ANTES de llamar `applyPayment` sobre la Debt. Si la segunda llamada falla, queda inconsistencia (Payment procesado, Debt sin actualizar). Decisión consciente para no bloquear al admin/MP. Mejora futura: outbox pattern o retry queue para garantizar eventual consistency.

## Arquitectura interna

```
apps/api/src/payments/
├── domain/
│   ├── entities/
│   │   └── payment.entity.ts           # Payment domain con markPaid/markFailed/canBeApproved
│   └── rules/
│       ├── transitions.rules.ts        # estado → estado válidos
│       ├── transitions.rules.spec.ts
│       ├── method-validation.rules.ts  # requiresProof / shouldAutoDeleteProof / normalizeMethod
│       └── method-validation.rules.spec.ts
├── application/
│   ├── ports/
│   │   ├── payment-repository.port.ts
│   │   ├── mercadopago.port.ts
│   │   ├── proof-storage.port.ts
│   │   ├── notification.port.ts
│   │   ├── debt-context.port.ts        # lectura mínima de Debt + RN-017 hasReusableInsurance
│   │   ├── registration-context.port.ts
│   │   ├── match-context.port.ts
│   │   └── profile-context.port.ts
│   ├── services/
│   │   ├── payments.service.ts                # facade interna (controller la usa)
│   │   └── registration-payments.service.ts   # FACADE público — exportado por el módulo
│   └── use-cases/
│       ├── create-checkout.use-case.ts        # MP — primario para FE
│       ├── create-payment.use-case.ts         # manual / interno
│       ├── create-mp-preference.use-case.ts   # legacy: re-crear preference de un Payment
│       ├── mark-as-paid.use-case.ts           # admin → applyPayment + PAYMENT_APPROVED
│       ├── mark-as-failed.use-case.ts
│       ├── upload-payment-proof.use-case.ts   # RN-014
│       ├── handle-mp-webhook.use-case.ts      # webhook MP → applyPayment + PAYMENT_APPROVED
│       ├── list-payments.use-case.ts
│       ├── get-payment.use-case.ts
│       ├── get-payment-status.use-case.ts
│       ├── get-payment-summary.use-case.ts
│       └── get-my-payments.use-case.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── mercadopago.adapter.ts             # envuelve services/mercadopago.service.ts (legacy)
│   │   ├── proof-storage.adapter.ts           # MediaAssetService → IProofStoragePort
│   │   └── notification.adapter.ts            # EmailService → IPaymentNotificationsPort
│   ├── listeners/
│   │   ├── payment-approved.listener.ts       # RN-060 schedule deletion
│   │   └── payment-approved.listener.spec.ts
│   └── repositories/
│       ├── prisma-payment.repository.ts
│       ├── prisma-registration-context.repository.ts
│       ├── prisma-match-context.repository.ts
│       ├── prisma-profile-context.repository.ts
│       └── prisma-debt-context.repository.ts
├── presentation/
│   ├── controllers/
│   │   ├── payments.controller.ts             # /api/v1/payments/*
│   │   └── registration-payments.controller.ts # /api/v1/registrations/:id/payment-status
│   ├── dto/
│   │   ├── payment.zod.ts
│   │   └── payment-request.dto.ts
│   └── mappers/
│       └── payment.mapper.ts
├── services/
│   └── mercadopago.service.ts                 # legacy SDK wrapper — sigue existiendo
└── payments.module.ts                          # exporta RegistrationPaymentsService
```

`PaymentsModule` importa:
- `DebtsModule` (W2.1) — `DebtsService.applyPayment / createInternal`.
- `PricingModule` (W2.3) — `PricingService.computeRegistrationFee`.
- `NotificationsModule` — `EmailService` (vía adapter).
- `DatabaseModule` — `PrismaService`.

`StorageModule` (PR0, global) provee `MediaAssetService` automáticamente.

## Tests agregados (61 suites en total, 409 tests)

Específicos de W2.2:

- `domain/rules/transitions.rules.spec.ts` — 8 cases de transiciones de estado.
- `domain/rules/method-validation.rules.spec.ts` — 6 cases de validación de método.
- `application/use-cases/mark-as-paid.use-case.spec.ts` — 5 cases (debt path, MP rejection, terminal status, registration legacy, not found).
- `application/use-cases/upload-payment-proof.use-case.spec.ts` — 5 cases (PDF ok, método no válido, status terminal, content-type rechazado, body vacío).
- `application/use-cases/create-payment.use-case.spec.ts` — 6 cases (default amount, exceeds balance, método inválido, debt PAID, sin resource, FRIENDLY_DEPOSIT).
- `application/use-cases/create-checkout.use-case.spec.ts` — 3 cases (FRIENDLY_DEPOSIT happy, MP disabled, debt PAID).
- `application/services/registration-payments.service.spec.ts` — 8 cases (create entry+insurances, RN-017 reuse, sin insurancePerPlayer, idempotencia, NOT_FOUND, status PENDING_BOTH/PLAZA_ASEGURADA/OFICIAL/RN-017 reused).
- `infrastructure/listeners/payment-approved.listener.spec.ts` — 3 cases (RN-060 schedule, MP skip, no proof skip).
