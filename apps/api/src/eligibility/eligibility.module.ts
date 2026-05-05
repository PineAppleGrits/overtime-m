import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { SanctionsModule } from '../sanctions/sanctions.module';

// Application — services
import { EligibilityService } from './application/services/eligibility.service';

// Application — use cases
import { CheckPlayerEligibilityForMatchUseCase } from './application/use-cases/check-player-eligibility-for-match.use-case';
import { CheckPlayerEligibilityForTournamentUseCase } from './application/use-cases/check-player-eligibility-for-tournament.use-case';
import { CheckTeamEligibilityForMatchUseCase } from './application/use-cases/check-team-eligibility-for-match.use-case';
import { UploadMedicalCertUseCase } from './application/use-cases/upload-medical-cert.use-case';
import { UploadSwornStatementUseCase } from './application/use-cases/upload-sworn-statement.use-case';
import { GetMedicalHistoryUseCase } from './application/use-cases/get-medical-history.use-case';

// Application — ports
import { ELIGIBILITY_REPOSITORY } from './application/ports/eligibility-repository.port';
import { ELIGIBILITY_SANCTIONS_PORT } from './application/ports/sanctions-port.port';
import { DEBTS_ELIGIBILITY_PORT } from './application/ports/debts-port.port';

// Infrastructure
import { PrismaEligibilityRepository } from './infrastructure/repositories/prisma-eligibility.repository';
import { SanctionsEligibilityAdapter } from './infrastructure/adapters/sanctions.adapter';
import { DebtsEligibilityAdapter } from './infrastructure/adapters/debts.adapter';

// Presentation
import { EligibilityController } from './presentation/controllers/eligibility.controller';

/**
 * W3.3 — Eligibility module (refactor a clean architecture).
 *
 * Cubre RN-003, RN-007, RN-008, RN-038, RN-053. Consume RN-030 vía W3.2.
 *
 * - Use-cases consolidados: player-match, player-tournament, team-match.
 * - Endpoints legacy mantenidos en `EligibilityController` para no romper FE.
 * - Endpoints nuevos: `/players/:id/match/:id`, `/players/:id/tournament/:id`,
 *   `/teams/:id/match/:id`, `/profiles/me/medical-cert`, `/profiles/me/sworn-statement`,
 *   `/profiles/:id/medical-history`.
 *
 * Exporta `EligibilityService` con compat de los métodos legacy
 * (`assertProfileNotBlacklisted`, `assertProfileEligibleForRegistration`,
 * `assertTeamEligibleForRegistration`, `assertTeamEligibleForMatch`,
 * `getProfileEligibility`, `getTeamEligibility`).
 */
@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => DebtsModule),
    forwardRef(() => SanctionsModule),
  ],
  controllers: [EligibilityController],
  providers: [
    // Facade
    EligibilityService,

    // Use-cases
    CheckPlayerEligibilityForMatchUseCase,
    CheckPlayerEligibilityForTournamentUseCase,
    CheckTeamEligibilityForMatchUseCase,
    UploadMedicalCertUseCase,
    UploadSwornStatementUseCase,
    GetMedicalHistoryUseCase,

    // Ports → infra
    { provide: ELIGIBILITY_REPOSITORY, useClass: PrismaEligibilityRepository },
    { provide: ELIGIBILITY_SANCTIONS_PORT, useClass: SanctionsEligibilityAdapter },
    { provide: DEBTS_ELIGIBILITY_PORT, useClass: DebtsEligibilityAdapter },
  ],
  exports: [EligibilityService],
})
export class EligibilityModule {}
