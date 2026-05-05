import { layout, RenderedEmail } from './base';

export interface SanctionCreatedData {
  recipientName: string;
  sanctionType: string;
  description?: string;
  fechasAffected?: number;
}

export function sanctionCreatedTemplate(
  data: SanctionCreatedData,
): RenderedEmail {
  const subject = `Sanción aplicada: ${data.sanctionType}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Se registró una sanción a tu nombre:</p>
    <ul>
      <li><strong>Tipo:</strong> ${data.sanctionType}</li>
      ${data.description ? `<li><strong>Descripción:</strong> ${data.description}</li>` : ''}
      ${data.fechasAffected !== undefined ? `<li><strong>Fechas afectadas:</strong> ${data.fechasAffected}</li>` : ''}
    </ul>
    <p>Revisá los detalles en tu perfil. Si querés apelar, escribinos.</p>
  `;
  const html = layout({ title: 'Sanción registrada', body });
  const text = `Sanción ${data.sanctionType}.${data.description ? ` ${data.description}` : ''}`;
  return { subject, html, text };
}
