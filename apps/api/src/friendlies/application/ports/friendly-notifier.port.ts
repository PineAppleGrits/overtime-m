/**
 * Port de notificaciones del módulo Friendlies.
 *
 * Implementación se apoya en `EmailService` del módulo Notifications. Lo
 * dejamos detrás de un port para mantener Friendlies fácil de mockear.
 */

export interface FriendlyEmailRecipients {
  /** Lista de delegados de ambos equipos con email + nombre. */
  recipients: { email: string; name: string }[];
}

export interface FriendlyGeneratedEmailInput extends FriendlyEmailRecipients {
  homeTeamName: string;
  awayTeamName: string;
  proposedDate: Date;
  confirmationDeadline: Date;
  depositAmount: number;
  currency: string;
}

export interface IFriendlyNotifier {
  notifyGenerated(input: FriendlyGeneratedEmailInput): Promise<void>;
}

export const FRIENDLY_NOTIFIER = Symbol('FRIENDLY_NOTIFIER');
