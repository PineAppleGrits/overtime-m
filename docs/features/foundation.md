# Foundation (PR0)

> Esta no es una feature de negocio sino la **base** sobre la que se construyen las olas siguientes. Documenta qué se agregó en PR0 y cómo lo usan las features.

## Resumen

PR0 deja:

1. **Schema completo** con todos los modelos del plan: `MediaAsset`, `Debt`, `DebtAudit`, `CategoryLevel`, `TeamCategoryLevel`, `Friendly`, `PlayoffSeries` + ajustes a entidades existentes.
2. **Infraestructura común** en `apps/api/src/common/`:
   - `storage/` — Supabase storage adapter + `MediaAsset` orquestador.
   - `sport-rules/` — registry + strategies (`Basketball5v5Rules`, `Basketball3v3Rules`).
   - `errors/` — `ErrorCode` enum + `BusinessError` exception class.
   - `cron/` — advisory locks Postgres + base abstracta para jobs idempotentes.
   - `events/` — namespace `DomainEvent` + payloads tipados (`@nestjs/event-emitter`).
3. **Tipos compartidos** en `packages/shared/src/`: `errors`, `sport`, `debt`, `playoff`, `friendly`, `media`, `category-level`.
4. **Auto-gen OpenAPI**: `pnpm generate:api-types` produce tipos en `packages/shared/src/generated/api.d.ts`.
5. **CI básico** (`.github/workflows/ci.yml`): lint + typecheck + build + jest.
6. **Versionado**: prefijo `/api/v1` desde el inicio.
7. **Plantilla de docs** en `docs/features/_template.md`.

## Cómo usar cada pieza

### Storage (`MediaAssetService`)

Inyectar `MediaAssetService` y usar:

```ts
const asset = await this.mediaAssets.upload({
  uploadedByProfileId: userId,
  category: MediaCategory.PAYMENT_PROOF,
  visibility: MediaVisibility.PRIVATE,
  contentType: 'application/pdf',
  originalFilename: 'comprobante-1234.pdf',
  body: buffer,
  metadata: { debtId },
  pathPrefix: `payment-proofs/${debtId}`,
});

// Para mostrar al FE:
const url = await this.mediaAssets.getAccessUrl(asset);
// → public bucket: URL directa
// → private bucket: signed URL con TTL 1h (default)

// RN-060 — programar borrado:
await this.mediaAssets.scheduleDeletion(asset.id, dayjs().add(3, 'day').toDate());
```

Buckets:
- `public` — avatares, logos, banners. URLs directas con cache CDN.
- `private` — comprobantes, documentos personales, sanciones. Siempre signed URLs (1h por defecto).

### Sport rules (`SportRulesRegistry`)

Inyectar `SportRulesRegistry` y resolver con `(sportCode, modality)`:

```ts
const rules = this.sportRules.get('BASKETBALL', '5v5');

// Validaciones
if (rules.roster.rosterMin > playerCount) {
  throw new BusinessError(
    ErrorCode.TEAM_ROSTER_BELOW_MIN,
    `El equipo debe tener al menos ${rules.roster.rosterMin} jugadores`,
  );
}

const error = rules.validateScore(home, away);
if (error) throw new BusinessError(ErrorCode.MATCH_INVALID_SCORE, error);

if (!rules.scoreCountsForStandings(home, away)) {
  // RN-024 — 0-0 no suma puntos
}
```

Strategies actuales: `BASKETBALL_5v5`, `BASKETBALL_3v3`. Para sumar otra modalidad o deporte, crear strategy en `strategies/` y registrarla en `SportRulesRegistry`.

### Errores (`BusinessError` + `ErrorCode`)

Lanzar excepciones de dominio con código estable:

```ts
import { BusinessError, ErrorCode } from '../../common/errors';
import { HttpStatus } from '@nestjs/common';

throw new BusinessError(
  ErrorCode.REGISTRATION_DUPLICATE,
  'El equipo ya está inscripto en este torneo',
  HttpStatus.CONFLICT,
  { teamId, tournamentId },
);
```

El `AllExceptionsFilter` serializa esto a:

```json
{
  "statusCode": 409,
  "code": "REGISTRATION_DUPLICATE",
  "message": "El equipo ya está inscripto en este torneo",
  "error": "Conflict",
  "details": { "teamId": "...", "tournamentId": "..." },
  "timestamp": "...",
  "path": "...",
  "method": "POST"
}
```

El FE matchea por `code` (no por `message`).

### Cron jobs (`CronBaseService` + `AdvisoryLockService`)

Para crear un job idempotente con lock distribuido:

```ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CronBaseService, AdvisoryLockService } from '../../common/cron';

@Injectable()
export class AccrueOverdueChargesJob extends CronBaseService {
  protected readonly lockName = 'cron.debts.accrue-overdue';

  constructor(
    advisoryLock: AdvisoryLockService,
    private readonly debtsService: DebtsService,
  ) {
    super(advisoryLock);
  }

  @Cron('0 6 * * *') // 6am todos los días
  async handle(): Promise<void> {
    await this.runWithLock(async () => {
      await this.debtsService.accrueOverdueCharges();
    });
  }
}
```

El lock se libera siempre (incluso ante errores). Si otra instancia tomó el lock, `runWithLock` retorna `null` sin ejecutar.

**Importante**: el job debe ser idempotente. Ejemplo: chequear "¿ya emití cargo hoy para esta deuda?" antes de emitir.

### Eventos del dominio

Inyectar `EventEmitter2` y emitir eventos del namespace `DomainEvent`:

```ts
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../common/events';

// Emitir
this.eventEmitter.emit(DomainEvent.REGISTRATION_APPROVED, {
  registrationId,
  teamId,
  tournamentId,
  approvedBy,
} satisfies DomainEventPayloads['registration.approved']);

// Escuchar (en otro feature)
@OnEvent(DomainEvent.REGISTRATION_APPROVED)
async handleApproved(payload: DomainEventPayloads['registration.approved']) {
  // notificar al equipo, crear debts, etc.
}
```

Wildcard listeners (`@OnEvent('match.*')`) están habilitados.

## Migración de URLs legacy

Compatibilidad híbrida (decisión PR0):
- Los campos URL viejos (`Profile.avatarUrl`, `Team.logoUrl`, `Profile.medicalCertificateUrl`, `Profile.swornStatementUrl`) se mantienen para histórico.
- Los nuevos uploads usan `MediaAsset` y guardan referencia en los campos `xxxAssetId`.
- Una migración futura backfilleará los URLs legacy a `MediaAsset` (sin sha256/size porque no los podemos recuperar).

## Qué NO está en PR0

PR0 deja la base. Lo siguiente vive en las olas 1-3:
- CRUD de las nuevas entidades (`Debt`, `Friendly`, `CategoryLevel`, `PlayoffSeries`) — cada feature owner.
- Lógica de negocio (creación de debts ante eventos, generación de bracket, etc.).
- Cron jobs concretos (accrue-overdue, friendly-expiration, payment-proof-cleanup).
- Endpoints HTTP — cada feature owner.
- Tests de dominio — cada feature owner.

Ver `docs/implementation-plan.md` y `docs/implementation-progress.md`.

## Comandos útiles

```bash
# Generar Prisma client tras cambios al schema
pnpm --filter overtime-be prisma:generate

# Aplicar migraciones (requiere DB)
pnpm --filter overtime-be prisma:migrate

# Generar OpenAPI spec + tipos para FE
pnpm generate:api-types

# Typecheck completo
pnpm typecheck

# Build completo
pnpm build

# Tests del API
pnpm --filter overtime-be test
```
