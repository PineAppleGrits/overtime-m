import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Profile } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { normalizeDocumentNumber } from '../../domain/rules/dni-validation.rules';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '../ports/profile-repository.port';

export interface VerifyDniInput {
  profileId: string;
  documentNumber: string;
  verifiedBy: string; // admin profile id
}

export interface VerifyDniResult {
  profile: Profile;
  blacklisted: boolean;
  merged: boolean;
  mergedFromProfileId?: string;
}

/**
 * RN-034 / RN-035 / RN-036 — admin verifica el DNI manualmente.
 *
 * Flujo:
 * 1. Normaliza + valida formato del documentNumber.
 * 2. Carga perfil objetivo. Falla si no existe o si ya está verificado.
 * 3. Chequea si existe Profile stub (sin supabaseUserId) con mismo DNI →
 *    fusiona (RN-035 nexo).
 * 4. Marca documentVerified + setea documentNumber + verifiedBy/At.
 * 5. Chequea blacklist por documentNumber → loguea warning.
 * 6. Emit PROFILE_DNI_VERIFIED (+ PROFILE_MERGED si fusionó).
 *
 * El stub previo se busca con `findStubByDocumentNumber()` y se fusiona en
 * una transacción atómica via `mergeProfiles()`.
 */
@Injectable()
export class VerifyDniUseCase {
  private readonly logger = new Logger(VerifyDniUseCase.name);

  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: VerifyDniInput): Promise<VerifyDniResult> {
    const { normalized, isValid } = normalizeDocumentNumber(
      input.documentNumber,
    );
    if (!isValid) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Número de documento inválido',
        HttpStatus.BAD_REQUEST,
        { documentNumber: input.documentNumber },
      );
    }

    const profile = await this.repo.findById(input.profileId);
    if (!profile) {
      throw new BusinessError(
        ErrorCode.PROFILE_NOT_FOUND,
        'Perfil no encontrado',
        HttpStatus.NOT_FOUND,
        { profileId: input.profileId },
      );
    }
    if (profile.documentVerified) {
      throw new BusinessError(
        ErrorCode.PROFILE_DNI_ALREADY_VERIFIED,
        'El DNI ya fue verificado anteriormente',
        HttpStatus.CONFLICT,
        { profileId: input.profileId },
      );
    }

    // Validar duplicado: si existe otro perfil con el mismo documentNumber y
    // tiene supabaseUserId (cuenta real), no se puede asignar.
    const existing = await this.repo.findByDocumentNumber(normalized);
    if (existing && existing.id !== input.profileId && existing.supabaseUserId) {
      throw new BusinessError(
        ErrorCode.PROFILE_DOCUMENT_NUMBER_TAKEN,
        'El documento ya está registrado en otra cuenta',
        HttpStatus.CONFLICT,
        { documentNumber: normalized, otherProfileId: existing.id },
      );
    }

    // RN-035 — nexo: si existe stub (sin cuenta) con ese DNI distinto al
    // perfil actual, fusionar.
    const stub = await this.repo.findStubByDocumentNumber(normalized);
    let merged = false;
    let mergedFromProfileId: string | undefined;
    if (stub && stub.id !== input.profileId) {
      try {
        const mergeResult = await this.repo.mergeProfiles({
          survivorProfileId: input.profileId,
          mergedProfileId: stub.id,
        });
        merged = true;
        mergedFromProfileId = stub.id;
        this.logger.log(
          `RN-035 — fusión profile stub=${stub.id} → ${input.profileId}: ${JSON.stringify(mergeResult.movedRelations)}`,
        );
      } catch (err) {
        const e = err as Error;
        this.logger.error(
          `Error fusionando profile stub=${stub.id} → ${input.profileId}: ${e.message}`,
          e.stack,
        );
        // No relanzamos: queremos completar la verificación aún si la fusión falla,
        // así el admin puede arreglar manualmente. El log queda como evidencia.
      }
    }

    const updated = await this.repo.markDocumentVerified({
      profileId: input.profileId,
      documentNumber: normalized,
      verifiedBy: input.verifiedBy,
    });

    let blacklisted = false;
    try {
      blacklisted = await this.repo.hasActiveBlacklist(normalized);
      if (blacklisted) {
        this.logger.warn(
          `Blacklist match — profile=${input.profileId} documentNumber=${normalized}. Notificar admins.`,
        );
      }
    } catch (err) {
      const e = err as Error;
      this.logger.warn(`hasActiveBlacklist falló: ${e.message}`);
    }

    this.eventEmitter.emit(DomainEvent.PROFILE_DNI_VERIFIED, {
      profileId: input.profileId,
      documentNumber: normalized,
      verifiedBy: input.verifiedBy,
    } satisfies DomainEventPayloads['profile.dni.verified']);

    if (merged && mergedFromProfileId) {
      this.eventEmitter.emit(DomainEvent.PROFILE_MERGED, {
        survivorProfileId: input.profileId,
        mergedProfileId: mergedFromProfileId,
        documentNumber: normalized,
      } satisfies DomainEventPayloads['profile.merged']);
    }

    return {
      profile: updated,
      blacklisted,
      merged,
      mergedFromProfileId,
    };
  }
}
