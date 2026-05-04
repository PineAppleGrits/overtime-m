import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Application — use cases
import { CancelFriendlyUseCase } from './application/use-cases/cancel-friendly.use-case';
import { ExpireOverdueFriendliesUseCase } from './application/use-cases/expire-overdue-friendlies.use-case';
import { GenerateFriendlyUseCase } from './application/use-cases/generate-friendly.use-case';
import { GetFriendlyUseCase } from './application/use-cases/get-friendly.use-case';
import { HandleDepositPaidUseCase } from './application/use-cases/handle-deposit-paid.use-case';
import { ListFriendliesUseCase } from './application/use-cases/list-friendlies.use-case';
import { MarkFriendlyPlayedUseCase } from './application/use-cases/mark-played.use-case';
import { ObserveForCategorizationUseCase } from './application/use-cases/observe-for-categorization.use-case';
import { RequestFriendlyUseCase } from './application/use-cases/request-friendly.use-case';

// Application — ports (symbols)
import { FRIENDLY_CONTEXT } from './application/ports/friendly-context.port';
import { FRIENDLY_DEPOSIT_SERVICE } from './application/ports/friendly-deposit-service.port';
import { FRIENDLY_MATCH_SERVICE } from './application/ports/friendly-match.port';
import { FRIENDLY_NOTIFIER } from './application/ports/friendly-notifier.port';
import { FRIENDLY_REPOSITORY } from './application/ports/friendly-repository.port';

// Infrastructure
import { ExpireFriendliesJob } from './infrastructure/jobs/expire-friendlies.job';
import { FriendliesEventListener } from './infrastructure/listeners/payment-approved.listener';
import { PrismaFriendlyRepository } from './infrastructure/repositories/prisma-friendly.repository';
import { FriendlyContextService } from './infrastructure/services/friendly-context.service';
import { FriendlyDepositService } from './infrastructure/services/friendly-deposit.service';
import { FriendlyMatchService } from './infrastructure/services/friendly-match.service';
import { FriendlyNotifierService } from './infrastructure/services/friendly-notifier.service';

// Presentation
import { FriendliesController } from './presentation/controllers/friendlies.controller';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [FriendliesController],
  providers: [
    // Use cases
    RequestFriendlyUseCase,
    GenerateFriendlyUseCase,
    HandleDepositPaidUseCase,
    CancelFriendlyUseCase,
    ExpireOverdueFriendliesUseCase,
    MarkFriendlyPlayedUseCase,
    ObserveForCategorizationUseCase,
    ListFriendliesUseCase,
    GetFriendlyUseCase,

    // Ports → infra bindings
    { provide: FRIENDLY_REPOSITORY, useClass: PrismaFriendlyRepository },
    { provide: FRIENDLY_CONTEXT, useClass: FriendlyContextService },
    { provide: FRIENDLY_DEPOSIT_SERVICE, useClass: FriendlyDepositService },
    { provide: FRIENDLY_MATCH_SERVICE, useClass: FriendlyMatchService },
    { provide: FRIENDLY_NOTIFIER, useClass: FriendlyNotifierService },

    // Listeners + jobs
    FriendliesEventListener,
    ExpireFriendliesJob,
  ],
})
export class FriendliesModule {}
