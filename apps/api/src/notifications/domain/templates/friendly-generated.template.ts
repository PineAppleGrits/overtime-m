import { formatDateAr, frontendUrl, layout, RenderedEmail } from './base';

export interface FriendlyGeneratedData {
  recipientName: string;
  homeTeamName: string;
  awayTeamName: string;
  matchDate: Date;
  venueName?: string;
  depositAmount?: number;
  depositDeadline?: Date;
}

/**
 * RN-022 — amistoso generado: notificación a ambos delegados.
 * Incluye recordatorio de seña + plazo si corresponde.
 */
export function friendlyGeneratedTemplate(
  data: FriendlyGeneratedData,
): RenderedEmail {
  const subject = `Amistoso generado: ${data.homeTeamName} vs ${data.awayTeamName}`;
  const seña = data.depositAmount && data.depositDeadline
    ? `<p><strong>Seña:</strong> $${data.depositAmount.toLocaleString('es-AR')} antes del ${formatDateAr(data.depositDeadline)}.</p>`
    : '';
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Se generó un amistoso entre <strong>${data.homeTeamName}</strong> y <strong>${data.awayTeamName}</strong>.</p>
    <ul>
      <li><strong>Fecha:</strong> ${formatDateAr(data.matchDate)}</li>
      ${data.venueName ? `<li><strong>Cancha:</strong> ${data.venueName}</li>` : ''}
    </ul>
    ${seña}
  `;
  const html = layout({
    title: 'Amistoso generado',
    body,
    cta: { url: frontendUrl('/my-teams'), label: 'Ver detalles' },
  });
  const text = `Amistoso ${data.homeTeamName} vs ${data.awayTeamName} el ${formatDateAr(data.matchDate)}.`;
  return { subject, html, text };
}
