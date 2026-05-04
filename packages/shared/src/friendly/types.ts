import type { Modality } from '../sport/types';

export type FriendlyStatus =
  | 'REQUESTED'
  | 'GENERATED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PLAYED'
  | 'OBSERVED_FOR_CATEGORIZATION';

export interface FriendlyDto {
  id: string;
  sportId: string;
  modality: Modality;
  homeTeamId: string;
  awayTeamId: string;
  proposedDate: string; // ISO
  venueId: string | null;
  status: FriendlyStatus;
  notes: string | null;
  confirmationDeadline: string | null;
  resultingMatchId: string | null;
  observedForCategorization: boolean;
  createdByProfileId: string;
  generatedByProfileId: string | null;
  generatedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inputs típicos del flujo (solicitud + generación). Los schemas zod
 * se agregan en la PR de Friendlies (W1.4).
 */
export interface RequestFriendlyInput {
  homeTeamId: string;
  awayTeamId: string;
  modality: Modality;
  proposedDate: string;
  venueId?: string;
  notes?: string;
}

export interface GenerateFriendlyInput {
  friendlyId: string;
  proposedDate?: string;
  venueId?: string;
}
