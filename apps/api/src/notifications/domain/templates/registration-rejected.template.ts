import { layout, RenderedEmail } from './base';

export interface RegistrationRejectedData {
  recipientName: string;
  teamName: string;
  tournamentName: string;
  reason?: string;
}

export function registrationRejectedTemplate(
  data: RegistrationRejectedData,
): RenderedEmail {
  const subject = `Inscripción rechazada: ${data.teamName}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Lamentablemente tu inscripción del equipo <strong>${data.teamName}</strong> en el torneo <strong>${data.tournamentName}</strong> no fue aprobada.</p>
    ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
    <p>Si tenés dudas, escribinos para revisar la situación.</p>
  `;
  const html = layout({ title: 'Inscripción rechazada', body });
  const text = `Inscripción rechazada\n\n${data.teamName} en ${data.tournamentName}.${data.reason ? ` Motivo: ${data.reason}` : ''}`;
  return { subject, html, text };
}
