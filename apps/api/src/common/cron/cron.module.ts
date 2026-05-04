import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdvisoryLockService } from './advisory-lock.service';

/**
 * Módulo global de soporte para crons.
 *
 * Provee `AdvisoryLockService` para que los jobs corran de forma exclusiva
 * incluso con múltiples instancias del API.
 *
 * Los jobs en sí viven en el módulo de su feature (ej. `DebtsModule`)
 * y extienden `CronBaseService`.
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AdvisoryLockService],
  exports: [AdvisoryLockService],
})
export class CronSupportModule {}
