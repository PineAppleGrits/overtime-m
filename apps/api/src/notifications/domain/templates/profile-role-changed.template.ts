import { layout, RenderedEmail } from './base';

export interface ProfileRoleChangedData {
  recipientName: string;
  fromRole: string;
  toRole: string;
}

export function profileRoleChangedTemplate(
  data: ProfileRoleChangedData,
): RenderedEmail {
  const subject = `Tu rol en Overtime cambió a ${data.toRole}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Tu rol en Overtime fue actualizado.</p>
    <ul>
      <li><strong>Rol anterior:</strong> ${data.fromRole}</li>
      <li><strong>Rol actual:</strong> ${data.toRole}</li>
    </ul>
    <p>Si este cambio no era el esperado, escribinos para revisarlo.</p>
  `;
  const html = layout({ title: 'Cambio de rol', body });
  const text = `Tu rol en Overtime cambió de ${data.fromRole} a ${data.toRole}.`;
  return { subject, html, text };
}
