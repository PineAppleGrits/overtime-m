import { frontendUrl, layout, RenderedEmail } from './base';

export interface DniPendingReviewData {
  recipientName: string;
  profileId: string;
  profileName: string;
}

/**
 * RN-036 — DP-009: notificación a admin cuando un perfil sube DNI y el
 * verificador automático no puede validar (requiresManualReview).
 */
export function dniPendingReviewTemplate(
  data: DniPendingReviewData,
): RenderedEmail {
  const subject = `Revisión manual de DNI: ${data.profileName}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>El usuario <strong>${data.profileName}</strong> subió una foto de DNI que requiere revisión manual.</p>
    <p>Entrá al panel de admin para validar el documento y completar la verificación.</p>
  `;
  const html = layout({
    title: 'Revisión manual de DNI',
    body,
    cta: {
      url: frontendUrl(`/admin/users/${data.profileId}`),
      label: 'Revisar DNI',
    },
  });
  const text = `DNI pendiente de revisión: ${data.profileName} (${data.profileId}).`;
  return { subject, html, text };
}
