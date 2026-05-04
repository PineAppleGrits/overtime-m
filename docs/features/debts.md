# Feature: debts

> Owner: W2.1 — `feat/api/debts`. Cubre RN-025/026/027/028/029/030/031/053/060.

## Casos de uso

1. **Crear deuda manual (admin)** — `POST /api/v1/debts`. Body con `type`, `concept`, `originAmount`, `dueDate`, target (`teamId` y/o `profileId`) y orígenes opcionales (`registrationId`, `matchId`, `friendlyId`, `sanctionId`). `currentBalance = originAmount`, `status = APPROVED`.
2. **Crear deuda interna (port)** — `DebtsService.createInternal(input)` para que otras features (registrations, friendlies, matches, sanctions, payments) emitan deudas automáticas (RN-014, RN-015, RN-022, RN-025, RN-027, RN-030, RN-042). Misma lógica, sin guard de admin.
3. **Listar deudas** — `GET /api/v1/debts?...`. Admin ve todas; usuario ve sólo las suyas (`profileId === userId` OR `teamId in userTeams`).
4. **Detalle** — `GET /api/v1/debts/:id`. Incluye pagos, debts hijas (intereses) y log de auditoría.
5. **Cambiar estado (admin)** — `PATCH /api/v1/debts/:id/status`. Sólo transiciones admin (RN-031): `APPROVED → DELETED_BY_ERROR | DELETED_WITH_RECORD | CANCELLED` y `PARTIALLY_PAID → CANCELLED`. Crea `DebtAudit`.
6. **Aplicar pago (port)** — `DebtsService.applyPayment({ debtId, amount, paidByProfileId })`. Descuenta de `currentBalance`, transiciona a `PARTIALLY_PAID` o `PAID`, crea audit y emite evento. **No crea Payment** — eso lo hace W2.2.
7. **Verificar deuda pendiente para bloquear partido** — `DebtsService.hasOutstandingDebts(teamId, opts?)`. RN-053. Soporta DP-006 con `allowFiftyPercentRule: boolean`.
8. **Cron OVERDUE_INTEREST (RN-028)** — diario 03:00, idempotente (metadata.dayKey).
9. **Cron LATE_PAYMENT_DAILY_CHARGE (RN-029)** — diario 03:00, idempotente.
10. **Cron AUTO_DELETE_PAYMENT_PROOFS (RN-060)** — diario 04:00, borra `MediaAsset` con `scheduledDeletionAt < now` y `category=PAYMENT_PROOF`.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-025 | Multa por no presentarse | docs/business-rules/fines.md |
| RN-026 | Pago parcial 50% (DP-006) | docs/business-rules/fines.md |
| RN-027 | Multa post fecha | docs/business-rules/fines.md |
| RN-028 | Interés por deuda vencida | docs/business-rules/fines.md |
| RN-029 | Arancel por pago fuera de fecha | docs/business-rules/fines.md |
| RN-030 | AJC | docs/business-rules/fines.md |
| RN-031 | Estados y gestión de deudas | docs/business-rules/fines.md |
| RN-053 | Deuda bloquea siguiente partido | docs/business-rules/matches.md |
| RN-060 | Auto-borrado comprobante transferencia | docs/business-rules/payments.md |

## Modelo

### Entidad principal

- **Tabla**: `debts` (modelo `Debt`).
- **Campos relevantes**: `type` (enum DebtType), `status` (enum DebtStatus), `concept`, `originAmount` (Decimal 12,2), `currentBalance` (Decimal 12,2), `currency`, `dueDate`, `teamId`/`profileId` (al menos uno), orígenes opcionales (`registrationId`, `matchId`, `friendlyId`, `sanctionId`), `parentDebtId` (deudas hijas para intereses RN-028), `metadata` (JSON, ej: `{ dayKey: 'YYYY-MM-DD' }` para idempotencia de crons).
- **Relaciones**: `Team`, `Profile`, `Registration`, `Match`, `Friendly`, `Sanction`, `Debt` (parent), `Payment[]`, `DebtAudit[]`, `Debt[]` (children).

### Auditoría

- **Tabla**: `debt_audits` (modelo `DebtAudit`).
- **Campos**: `debtId`, `fromStatus`, `toStatus`, `reason`, `byProfileId`, `at`. Se crea en cada cambio de estado.

### Estados y transiciones

```
APPROVED ──(applyPayment)──> PARTIALLY_PAID ──(applyPayment hasta saldar)──> PAID
   │                              │
   ├──(admin DELETED_BY_ERROR)    └──(admin CANCELLED)
   ├──(admin DELETED_WITH_RECORD)
   └──(admin CANCELLED)
```

- **Transiciones por payment** (`applyPayment`): `APPROVED|PARTIALLY_PAID → PARTIALLY_PAID|PAID` automático según saldo.
- **Transiciones admin** (RN-031): subset bloqueado al endpoint admin (`PATCH /:id/status`).
- **Estados terminales**: `PAID`, `DELETED_BY_ERROR`, `DELETED_WITH_RECORD`, `CANCELLED`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/debts | admin | Crear deuda manual |
| GET    | /api/v1/debts | auth (admin ve todas; user ve sus equipos) | Listar |
| GET    | /api/v1/debts/:id | auth (admin o owner) | Detalle |
| PATCH  | /api/v1/debts/:id/status | admin | Cambiar estado RN-031 |

### POST /api/v1/debts

- **Auth**: `admin`/`master`.
- **Body**:
  ```ts
  {
    type: DebtType,
    concept: string,
    originAmount: number,
    dueDate: string (ISO),
    currency?: string, // default ARS
    teamId?: uuid,
    profileId?: uuid,
    registrationId?, matchId?, friendlyId?, sanctionId?: uuid,
    notes?: string,
    metadata?: Record<string, unknown>,
  }
  ```
  Requiere al menos uno de `teamId`/`profileId`.
- **Response 201**: `DebtResponseDto` con `payments`, `childDebts`, `audits` (vacíos al crear).
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | Body inválido / sin teamId ni profileId / monto ≤ 0 |
- **RN aplicadas**: RN-031 (auditoría), `status=APPROVED` por defecto.
- **Eventos disparados**: `debt.created`.

### GET /api/v1/debts

- **Auth**: cualquier usuario autenticado.
- **Query**: `teamId?`, `profileId?`, `status?`, `type?`, `from?`, `to?`, `overdueOnly?`, `page?`, `limit?`.
- **Visibilidad**:
  - Admin: ve todas.
  - Usuario: filtro implícito `profileId === user.id OR teamId in user.teams`.
- **Response 200**: `{ data: DebtResponseDto[], total, page, limit }`.

### GET /api/v1/debts/:id

- **Auth**: cualquier autenticado. Admin ve cualquiera; usuario sólo si es owner.
- **Response 200**: `DebtResponseDto` con `payments`, `childDebts`, `audits`.
- **Errores**: 404 NOT_FOUND si no existe o el usuario no es owner (no hay leak por enumeración).

### PATCH /api/v1/debts/:id/status

- **Auth**: `admin`/`master`.
- **Body**: `{ toStatus: DebtStatus, reason?: string }`.
- **Transiciones admitidas**:
  - `APPROVED → DELETED_BY_ERROR`
  - `APPROVED → DELETED_WITH_RECORD`
  - `APPROVED → CANCELLED`
  - `PARTIALLY_PAID → CANCELLED`
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 404 | NOT_FOUND | Deuda no existe |
  | 409 | DEBT_INVALID_STATUS_TRANSITION | Transición ilegal |
- **RN aplicadas**: RN-031.
- **Eventos disparados**: `debt.cancelled` cuando `toStatus = CANCELLED`.

## Ports (consumo desde otras features)

`DebtsService` (exportado por `DebtsModule`):

```ts
class DebtsService {
  /** Crear deuda automática (otra feature). Emite debt.created. */
  createInternal(input: CreateDebtInternalInput): Promise<DebtWithRelations>;

  /** Aplicar pago al saldo. NO crea Payment. Emite debt.partially.paid o debt.fully.paid. */
  applyPayment(input: { debtId; amount; paidByProfileId }): Promise<DebtWithRelations>;

  /** RN-053 — true si el equipo tiene deudas vencidas activas. */
  hasOutstandingDebts(teamId: string, opts?: { allowFiftyPercentRule?: boolean }): Promise<boolean>;

  /** RN-053 — versión con detalle. */
  findOutstandingDebts(teamId: string, opts?): Promise<DebtWithRelations[]>;
}
```

**Consumidores esperados**:
- W2.2 (Payments): inyecta `DebtsService` para llamar `applyPayment` tras aprobar un Payment.
- W3.1 (Match lifecycle): llama `hasOutstandingDebts` para bloquear partidos (RN-053).
- W1.4 (Friendlies, ya en main): llama `createInternal` con `type=FRIENDLY_DEPOSIT`.
- Registrations / sanctions / matches: idem para los otros tipos.

## Crons

| Job | Schedule | Lock | RN |
|-----|----------|------|-----|
| `AccrueOverdueInterestJob` | EVERY_DAY_AT_3AM | `cron.debts.accrue-overdue-interest` | RN-028 |
| `AccrueLatePaymentDailyChargeJob` | EVERY_DAY_AT_3AM | `cron.debts.late-payment-daily-charge` | RN-029 |
| `DeleteScheduledPaymentProofsJob` | EVERY_DAY_AT_4AM | `cron.media.delete-scheduled-payment-proofs` | RN-060 |

**Idempotencia (RN-028 / RN-029)**: cada cargo se crea con `metadata.dayKey = YYYY-MM-DD`. Antes de emitir, se chequea `hasChildDebtForDay({ parentDebtId, type, dayKey })`. Si ya existe, se skippea.

**Monto del cargo diario**: hoy default `$5.000` (constante `DEFAULT_OVERDUE_DAILY_AMOUNT` — RN-028 referencial). El port `IDebtContext.resolveOverdueDailyAmountForDebt(debtId)` retorna `null` por ahora; cuando se cierre **RN-021 / DP de tarifas configurables** se debe leer del torneo asociado o de un setting global. TODO marcado en `DebtContextService`.

**Excluye autorelaciones**: el cron OVERDUE_INTEREST excluye `OVERDUE_INTEREST | LATE_PAYMENT_DAILY_CHARGE | REGISTRATION_FEE | INSURANCE`. El cron LATE_PAYMENT_DAILY_CHARGE solo procesa `REGISTRATION_FEE | INSURANCE`.

## Casos especiales

- **Pago decimal**: toda la math se hace con `Prisma.Decimal`. Nunca convertimos a `number` para sumar/restar (pérdida de precisión en montos grandes). El payload del evento `debt.partially.paid`/`debt.fully.paid` sí pasa `paidAmount` y `remainingBalance` como `number` (los consumidores son listeners de notificación, no contables).
- **DP-006 (regla del 50%)**: el flag `allowFiftyPercentRule` está implementado en `Debt.isHalfOrMorePaid()` y `CheckTeamOutstandingDebtsUseCase`. Por ahora **el caller (W3.1) tiene que pasarlo explícito** y el default en cualquier llamada interna queda en `false`. TODO en código: `// TODO: DP-006 — habilitar cuando se confirme la regla del 50%.`
- **DP-016 (número comprobante)**: no se implementa acá — vive en W2.2 (Payments). Este worktree solo cubre el **cron** que borra el comprobante 3 días después.
- **Visibilidad**: el listado y el detalle aplican filtros por `profileId` y `teamIds` cuando el caller no es admin. Si no hay matches, el detalle devuelve `404 NOT_FOUND` para evitar leak.

## Eventos del dominio

Eventos que esta feature **emite**:

- `debt.created` — payload `{ debtId, type, amount, teamId?, profileId? }`. Se emite tanto en endpoint admin como en port internal.
- `debt.partially.paid` — payload `{ debtId, paidAmount, remainingBalance }`.
- `debt.fully.paid` — payload `{ debtId }`.
- `debt.cancelled` — payload `{ debtId, reason? }`. Sólo cuando admin transiciona a `CANCELLED`.
- `debt.overdue.detected` — payload `{ debtId }`. Emitido por los crons RN-028/029 cuando detectan deuda vencida y emiten cargo.

Eventos que esta feature **escucha**:

- (ninguno por ahora — ver "Listener payment.approved" abajo).

### Listener `payment.approved` (RN-060) — contrato a implementar en W2.2

Este worktree **no implementa** el listener que programa el borrado del comprobante. La razón: la lógica vive más cerca de Payment (que tiene la relación con `MediaAsset` y conoce el `method`). El contrato esperado en W2.2:

```ts
@OnEvent(DomainEvent.PAYMENT_APPROVED)
async handlePaymentApproved(payload: DomainEventPayloads['payment.approved']) {
  if (payload.method !== 'transferencia') return;
  const proofAssetId = await this.findProofAssetForPayment(payload.paymentId);
  if (!proofAssetId) return;
  const deleteAt = dayjs().add(3, 'day').toDate();
  await this.mediaAssets.scheduleDeletion(proofAssetId, deleteAt);
}
```

`MediaAssetService.scheduleDeletion` ya existe (PR0). Una vez que el `scheduledDeletionAt` está seteado, el cron de este worktree (`DeleteScheduledPaymentProofsJob`) lo procesa al día siguiente.

## Errores específicos

Códigos definidos en `ErrorCode` (PR0) — usados aquí:

- `DEBT_ALREADY_PAID` — intento de pagar una deuda en `PAID`.
- `DEBT_AMOUNT_EXCEEDS_BALANCE` — pago supera el saldo.
- `DEBT_INVALID_STATUS_TRANSITION` — cambio de estado no permitido (RN-031), o intento de aplicar pago sobre `CANCELLED|DELETED_*`.
- `MATCH_TEAM_HAS_OUTSTANDING_DEBT` — RN-053 (lo lanza W3.1 cuando consume `hasOutstandingDebts`).
- `NOT_FOUND` — deuda no existe o no visible para el caller.
- `VALIDATION_FAILED` — sin target, monto ≤ 0, etc.

## Pendientes / TODOs

- **DP-006** (`allowFiftyPercentRule`): flag implementado pero default `false`. Habilitar por feature flag o config cuando producto cierre la decisión. Marcado en `CheckTeamOutstandingDebtsUseCase`.
- **DP-007** (AJC fechas mínimas): el módulo Debts soporta crear deudas `AJC_FEE`; la **lógica de cuándo se puede generar** (X fechas cumplidas) vive en W3.3 / sanctions.
- **DP-016** (número comprobante): la implementación vive en W2.2. Este worktree solo cubre el cron de borrado.
- **RN-021 / fee global configurable**: hoy `DEFAULT_OVERDUE_DAILY_AMOUNT = 5000`. `IDebtContext.resolveOverdueDailyAmountForDebt` siempre retorna `null`; cuando se cierre la decisión de cómo se configura el fee (por torneo, global, etc.), implementar acá la lookup. TODOs marcados en código.

## Decisiones de diseño

- **Money**: toda la aritmética con `Prisma.Decimal`. Helpers `toDecimal(...)` aceptan `number | string | Prisma.Decimal` para que callers internos pasen lo que les sea más natural.
- **Idempotencia**: para los crons, `metadata.dayKey = YYYY-MM-DD` (UTC). El query usa `Prisma.JsonFilter` con `path: ['dayKey']`.
- **Visibilidad**: filtro en repo (Prisma `OR`), nunca a nivel servicio (evita N+1 y dependencias circulares).
- **Audit log**: se crea atómicamente con el `update` dentro de `prisma.$transaction` — `applyPayment` y `changeStatus` lo cubren.
- **Crons no inyectan controllers**: cada job extiende `CronBaseService`, toma su lock, y delega al use-case correspondiente. Los use-cases son testeables sin Cron.
- **Listener payment.approved no se implementa acá** — el contrato queda documentado y W2.2 lo cubre porque conoce el `Payment.method` y la relación con el `MediaAsset` del comprobante.
