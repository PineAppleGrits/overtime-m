import { frontendUrl, layout, RenderedEmail } from './base';

export interface RegistrationApprovedData {
  recipientName: string;
  teamName: string;
  tournamentName: string;
  categoryName?: string;
}

/**
 * RN-013 — confirmación de inscripción aprobada al delegado.
 */
export function registrationApprovedTemplate(
  data: RegistrationApprovedData,
): RenderedEmail {
  const subject = `Inscripción aprobada: ${data.teamName} en ${data.tournamentName}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Tu inscripción fue aprobada. Ya pueden participar del torneo.</p>
    <ul>
      <li><strong>Equipo:</strong> ${data.teamName}</li>
      <li><strong>Torneo:</strong> ${data.tournamentName}</li>
      ${data.categoryName ? `<li><strong>Categoría:</strong> ${data.categoryName}</li>` : ''}
    </ul>
    <p>Entrá a la plataforma para ver el fixture y los horarios.</p>
  `;
  const html = layout({
    title: 'Inscripción aprobada',
    body,
    cta: { url: frontendUrl('/my-teams'), label: 'Ver mis equipos' },
  });
  const text = `Inscripción aprobada\n\nHola ${data.recipientName}, tu inscripción del equipo ${data.teamName} en ${data.tournamentName} fue aprobada.`;
  return { subject, html, text };
}
