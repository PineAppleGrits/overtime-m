import { formatDateAr, layout, RenderedEmail } from './base';

export interface MatchRescheduledData {
  recipientName: string;
  homeTeamName: string;
  awayTeamName: string;
  previousDate: Date;
  newDate: Date;
  reason?: string;
}

export function matchRescheduledTemplate(
  data: MatchRescheduledData,
): RenderedEmail {
  const subject = `Partido reprogramado: ${data.homeTeamName} vs ${data.awayTeamName}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Tu partido <strong>${data.homeTeamName} vs ${data.awayTeamName}</strong> fue reprogramado.</p>
    <ul>
      <li><strong>Fecha anterior:</strong> ${formatDateAr(data.previousDate)}</li>
      <li><strong>Nueva fecha:</strong> ${formatDateAr(data.newDate)}</li>
    </ul>
    ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
  `;
  const html = layout({ title: 'Partido reprogramado', body });
  const text = `Tu partido ${data.homeTeamName} vs ${data.awayTeamName} se reprogramó del ${formatDateAr(data.previousDate)} al ${formatDateAr(data.newDate)}.`;
  return { subject, html, text };
}
