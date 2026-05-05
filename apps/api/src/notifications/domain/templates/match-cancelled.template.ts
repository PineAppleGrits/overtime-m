import { layout, RenderedEmail } from './base';

export interface MatchCancelledData {
  recipientName: string;
  homeTeamName: string;
  awayTeamName: string;
  reason?: string;
  requiresRivalDecision?: boolean;
}

export function matchCancelledTemplate(
  data: MatchCancelledData,
): RenderedEmail {
  const subject = `Partido cancelado: ${data.homeTeamName} vs ${data.awayTeamName}`;
  const followUp = data.requiresRivalDecision
    ? '<p>Como rival, tenés que decidir si querés solicitar los puntos o reprogramar (RN-032).</p>'
    : '';
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>El partido <strong>${data.homeTeamName} vs ${data.awayTeamName}</strong> fue cancelado.</p>
    ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
    ${followUp}
  `;
  const html = layout({ title: 'Partido cancelado', body });
  const text = `Partido ${data.homeTeamName} vs ${data.awayTeamName} cancelado.${data.reason ? ` Motivo: ${data.reason}` : ''}`;
  return { subject, html, text };
}
