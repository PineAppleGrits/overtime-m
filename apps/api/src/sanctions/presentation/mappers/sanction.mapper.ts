import { Sanction } from '../../domain/entities/sanction.entity';
import { readFechasState } from '../../domain/rules/fechas-counting.rules';

export interface SanctionResponseDto {
  id: string;
  targetType: 'PROFILE' | 'TEAM';
  targetProfileId: string | null;
  targetTeamId: string | null;
  kind: 'DISCIPLINARY' | 'MONETARY';
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED';
  reason: string;
  notes: string | null;
  attachmentUrls: string[];
  matchId: string | null;
  tournamentId: string | null;
  categoryId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  amount: number | null;
  currency: string;
  fechas: { totalFechas: number; fechasCumplidas: number } | null;
  createdByProfileId: string;
  resolvedByProfileId: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toSanctionResponse(sanction: Sanction): SanctionResponseDto {
  const props = sanction.toProps();
  const fechas = readFechasState(props.notes);
  return {
    id: props.id,
    targetType: props.targetType,
    targetProfileId: props.targetProfileId,
    targetTeamId: props.targetTeamId,
    kind: props.kind,
    status: props.status,
    reason: props.reason,
    notes: props.notes,
    attachmentUrls: props.attachmentUrls,
    matchId: props.matchId,
    tournamentId: props.tournamentId,
    categoryId: props.categoryId,
    startsAt: props.startsAt ? props.startsAt.toISOString() : null,
    endsAt: props.endsAt ? props.endsAt.toISOString() : null,
    amount: props.amount,
    currency: props.currency,
    fechas,
    createdByProfileId: props.createdByProfileId,
    resolvedByProfileId: props.resolvedByProfileId,
    resolvedAt: props.resolvedAt ? props.resolvedAt.toISOString() : null,
    resolutionNotes: props.resolutionNotes,
    createdAt: props.createdAt.toISOString(),
    updatedAt: props.updatedAt.toISOString(),
  };
}
