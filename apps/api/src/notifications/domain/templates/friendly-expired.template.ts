import { layout, RenderedEmail } from './base';

export interface FriendlyExpiredData {
  recipientName: string;
  homeTeamName: string;
  awayTeamName: string;
  reason?: string;
}

/**
 * RN-023 — amistoso expirado por falta de seña en término.
 */
export function friendlyExpiredTemplate(
  data: FriendlyExpiredData,
): RenderedEmail {
  const subject = `Amistoso expirado: ${data.homeTeamName} vs ${data.awayTeamName}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>El amistoso entre <strong>${data.homeTeamName}</strong> y <strong>${data.awayTeamName}</strong> fue expirado por falta de confirmación o seña en el plazo.</p>
    ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
    <p>Si querés reagendar, generá una nueva solicitud.</p>
  `;
  const html = layout({ title: 'Amistoso expirado', body });
  const text = `Amistoso ${data.homeTeamName} vs ${data.awayTeamName} expirado.`;
  return { subject, html, text };
}
