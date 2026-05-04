import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Application — services (facade)
import { DebtsService } from './application/services/debts.service';

// Application — use cases
import { CreateDebtUseCase } from './application/use-cases/create-debt.use-case';
import { CreateDebtInternalUseCase } from './application/use-cases/create-debt-internal.use-case';
import { ChangeDebtStatusUseCase } from './application/use-cases/change-debt-status.use-case';
import { ApplyPaymentToDebtUseCase } from './application/use-cases/apply-payment-to-debt.use-case';
import { ListDebtsUseCase } from './application/use-cases/list-debts.use-case';
import { GetDebtUseCase } from './application/use-cases/get-debt.use-case';
import { CheckTeamOutstandingDebtsUseCase } from './application/use-cases/check-team-outstanding-debts.use-case';
import { AccrueOverdueInterestUseCase } from './application/use-cases/accrue-overdue-interest.use-case';
import { AccrueLatePaymentDailyChargeUseCase } from './application/use-cases/accrue-late-payment-daily-charge.use-case';
import { DeleteScheduledPaymentProofsUseCase } from './application/use-cases/delete-scheduled-payment-proofs.use-case';

// Application — ports (symbols)
import { DEBT_REPOSITORY } from './application/ports/debt-repository.port';
import { DEBT_AUDIT_REPOSITORY } from './application/ports/debt-audit-repository.port';
import { DEBT_CONTEXT } from './application/ports/debt-context.port';

// Infrastructure
import { PrismaDebtRepository } from './infrastructure/repositories/prisma-debt.repository';
import { PrismaDebtAuditRepository } from './infrastructure/repositories/prisma-debt-audit.repository';
import { DebtContextService } from './infrastructure/services/debt-context.service';
import { AccrueOverdueInterestJob } from './infrastructure/jobs/accrue-overdue-interest.job';
import { AccrueLatePaymentDailyChargeJob } from './infrastructure/jobs/accrue-late-payment-daily-charge.job';
import { DeleteScheduledPaymentProofsJob } from './infrastructure/jobs/delete-scheduled-payment-proofs.job';

// Presentation
import { DebtsController } from './presentation/controllers/debts.controller';

/**
 * W2.1 — Módulo de deudas.
 *
 * Cubre RN-025/026/027/028/029/030/031/053/060.
 *
 * Exporta `DebtsService` (facade) para que otras features (W2.2 Payments,
 * W3.1 Match lifecycle, registrations, friendlies, sanctions) la usen.
 *
 * Las dependencias en common (`PrismaService`, `MediaAssetService`,
 * `AdvisoryLockService`, `EventEmitter2`) se resuelven por el contenedor
 * gracias a los modules globales (`DatabaseModule`, `StorageModule`,
 * `CronSupportModule`, `EventEmitterModule`).
 */
@Module({
  imports: [DatabaseModule],
  controllers: [DebtsController],
  providers: [
    // Facade
    DebtsService,

    // Use cases
    CreateDebtUseCase,
    CreateDebtInternalUseCase,
    ChangeDebtStatusUseCase,
    ApplyPaymentToDebtUseCase,
    ListDebtsUseCase,
    GetDebtUseCase,
    CheckTeamOutstandingDebtsUseCase,
    AccrueOverdueInterestUseCase,
    AccrueLatePaymentDailyChargeUseCase,
    DeleteScheduledPaymentProofsUseCase,

    // Ports → infra bindings
    { provide: DEBT_REPOSITORY, useClass: PrismaDebtRepository },
    { provide: DEBT_AUDIT_REPOSITORY, useClass: PrismaDebtAuditRepository },
    { provide: DEBT_CONTEXT, useClass: DebtContextService },

    // Jobs
    AccrueOverdueInterestJob,
    AccrueLatePaymentDailyChargeJob,
    DeleteScheduledPaymentProofsJob,
  ],
  exports: [DebtsService],
})
export class DebtsModule {}
