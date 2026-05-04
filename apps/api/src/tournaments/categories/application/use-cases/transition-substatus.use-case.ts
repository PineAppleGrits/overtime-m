import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CategorySubstatus, CategoryStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessError, ErrorCode } from '../../../../common/errors';
import {
  DomainEvent,
  DomainEventPayloads,
} from '../../../../common/events/domain-events';

export type CategoryTransitionTarget =
  | { kind: 'startPlayoffs' }
  | {
      kind: 'finish';
      championTeamId?: string;
      runnerUpTeamId?: string;
      lastTeamId?: string;
    };

/**
 * Transiciones de `Category.substatus` con eventos de dominio.
 *
 * - `REGULAR_FASE → PLAYOFFS_FASE` emite `category.playoffs.started`.
 * - Al terminar playoffs (status = FINISHED) emite `category.finished`.
 *
 * RN-047 — una vez que la categoría está en `PLAYOFFS_FASE`, la
 * configuración de playoffs queda congelada (validado en
 * UpdatePlayoffConfigUseCase).
 */
@Injectable()
export class TransitionCategorySubstatusUseCase {
  private readonly logger = new Logger(TransitionCategorySubstatusUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    categoryId: string,
    target: CategoryTransitionTarget,
  ): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      select: { id: true, substatus: true, status: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    if (target.kind === 'startPlayoffs') {
      if (category.substatus === CategorySubstatus.PLAYOFFS_FASE) {
        // Idempotente — ya estaba en playoffs, no re-emitimos.
        return;
      }
      await this.prisma.category.update({
        where: { id: categoryId },
        data: { substatus: CategorySubstatus.PLAYOFFS_FASE },
      });
      this.eventEmitter.emit(DomainEvent.CATEGORY_PLAYOFFS_STARTED, {
        categoryId,
      } satisfies DomainEventPayloads['category.playoffs.started']);
      this.logger.log(`Category ${categoryId} → PLAYOFFS_FASE`);
      return;
    }

    if (target.kind === 'finish') {
      if (category.status === CategoryStatus.FINISHED) {
        return;
      }
      // Solo permitido desde PLAYOFFS_FASE (o si no hay substatus aún, p.ej.
      // formato sin playoffs explícitos).
      if (
        category.substatus !== null &&
        category.substatus !== CategorySubstatus.PLAYOFFS_FASE
      ) {
        throw new BusinessError(
          ErrorCode.CONFLICT,
          'Solo se puede finalizar la categoría desde la fase de playoffs.',
          HttpStatus.CONFLICT,
          { categoryId, substatus: category.substatus },
        );
      }

      await this.prisma.category.update({
        where: { id: categoryId },
        data: { status: CategoryStatus.FINISHED },
      });

      this.eventEmitter.emit(DomainEvent.CATEGORY_FINISHED, {
        categoryId,
        championTeamId: target.championTeamId,
        runnerUpTeamId: target.runnerUpTeamId,
        lastTeamId: target.lastTeamId,
      } satisfies DomainEventPayloads['category.finished']);
      this.logger.log(`Category ${categoryId} → FINISHED`);
      return;
    }
  }
}
