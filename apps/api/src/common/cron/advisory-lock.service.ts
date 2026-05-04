import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

/**
 * Advisory locks de Postgres — soporte para que un cron corra de forma
 * exclusiva incluso con múltiples instancias del API.
 *
 * `pg_try_advisory_lock(key)` toma el lock si está libre y devuelve true;
 * si ya lo tiene otra sesión devuelve false sin bloquear. El lock se libera
 * con `pg_advisory_unlock` o cuando termina la conexión.
 *
 * Postgres acepta keys bigint (64-bit). Convertimos un nombre de job a un
 * número estable hash → bigint.
 */
@Injectable()
export class AdvisoryLockService {
  private readonly logger = new Logger(AdvisoryLockService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Intenta tomar un lock por nombre. Si está libre, ejecuta `fn` y libera
   * el lock al final (incluso ante errores).
   *
   * Si está tomado por otra sesión, retorna `null` y no ejecuta nada.
   *
   * Devuelve `null` si el lock no se pudo tomar; sino el resultado de `fn`.
   */
  async runIfAcquired<T>(
    lockName: string,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    const key = lockKey(lockName);

    const acquired = await this.tryAcquire(key);
    if (!acquired) {
      this.logger.debug(`Lock ${lockName} (${key}) ocupado — skip`);
      return null;
    }

    try {
      return await fn();
    } finally {
      await this.release(key).catch((err: Error) =>
        this.logger.error(
          `Error liberando lock ${lockName} (${key}): ${err.message}`,
        ),
      );
    }
  }

  private async tryAcquire(key: bigint): Promise<boolean> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ acquired: boolean }>>(
      'SELECT pg_try_advisory_lock($1::bigint) as acquired',
      key.toString(),
    );
    return rows[0]?.acquired === true;
  }

  private async release(key: bigint): Promise<void> {
    await this.prisma.$queryRawUnsafe(
      'SELECT pg_advisory_unlock($1::bigint)',
      key.toString(),
    );
  }
}

/**
 * Convierte un nombre de job a un bigint estable.
 * Tomamos los primeros 8 bytes del sha256 → 64-bit signed (Postgres bigint).
 */
function lockKey(lockName: string): bigint {
  const digest = createHash('sha256').update(lockName).digest();
  // Read first 8 bytes as BigInt64BE
  const view = digest.subarray(0, 8);
  return view.readBigInt64BE(0);
}
