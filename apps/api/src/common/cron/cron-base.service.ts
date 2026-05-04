import { Logger } from '@nestjs/common';
import { AdvisoryLockService } from './advisory-lock.service';

/**
 * Clase base para jobs idempotentes con advisory lock.
 *
 * Patrón de uso:
 * ```ts
 * @Injectable()
 * export class AccrueOverdueChargesJob extends CronBaseService {
 *   protected readonly lockName = 'cron.debts.accrue-overdue';
 *
 *   constructor(
 *     advisoryLock: AdvisoryLockService,
 *     private readonly debtsService: DebtsService,
 *   ) {
 *     super(advisoryLock);
 *   }
 *
 *   @Cron('0 6 * * *') // 6am todos los días
 *   async handle() {
 *     await this.runWithLock(async () => {
 *       await this.debtsService.accrueOverdueCharges();
 *     });
 *   }
 * }
 * ```
 *
 * Reglas para subclases:
 * - **Idempotencia**: el job debe ser seguro de re-ejecutar si se pierde una
 *   corrida (ej: chequear "ya emití cargo hoy?" antes de emitir).
 * - **lockName** debe ser único por job. Convención: `cron.<feature>.<action>`.
 */
export abstract class CronBaseService {
  protected readonly logger: Logger;

  constructor(protected readonly advisoryLock: AdvisoryLockService) {
    this.logger = new Logger(this.constructor.name);
  }

  protected abstract readonly lockName: string;

  /**
   * Ejecuta `fn` solo si pudo tomar el lock por nombre. Si está ocupado en
   * otra instancia, loguea y termina.
   */
  protected async runWithLock<T>(fn: () => Promise<T>): Promise<T | null> {
    const startedAt = Date.now();
    this.logger.log(`Job ${this.lockName} — intentando ejecutar`);

    try {
      const result = await this.advisoryLock.runIfAcquired(this.lockName, fn);
      const elapsed = Date.now() - startedAt;
      if (result === null) {
        this.logger.log(
          `Job ${this.lockName} — lock ocupado, skip (${elapsed}ms)`,
        );
      } else {
        this.logger.log(`Job ${this.lockName} — completado en ${elapsed}ms`);
      }
      return result;
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Job ${this.lockName} — error: ${error.message}`,
        error.stack,
      );
      throw err;
    }
  }
}
