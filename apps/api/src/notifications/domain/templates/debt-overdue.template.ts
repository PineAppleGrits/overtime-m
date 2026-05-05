import { formatCurrencyAr, frontendUrl, layout, RenderedEmail } from './base';

export interface DebtOverdueData {
  recipientName: string;
  debtConcept: string;
  amount: number;
  currency?: string;
  daysOverdue?: number;
}

/**
 * RN-025 a RN-031 — deuda vencida detectada (cron diario).
 * Notifica al delegado del equipo o al perfil deudor.
 */
export function debtOverdueTemplate(data: DebtOverdueData): RenderedEmail {
  const subject = `Deuda vencida: ${data.debtConcept}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Te avisamos que tenés una deuda vencida:</p>
    <ul>
      <li><strong>Concepto:</strong> ${data.debtConcept}</li>
      <li><strong>Monto:</strong> ${formatCurrencyAr(data.amount, data.currency)}</li>
      ${data.daysOverdue !== undefined ? `<li><strong>Días vencida:</strong> ${data.daysOverdue}</li>` : ''}
    </ul>
    <p>Por favor regularizá tu situación para evitar penalizaciones (RN-053 — bloqueo de partidos por deuda).</p>
  `;
  const html = layout({
    title: 'Deuda vencida',
    body,
    cta: { url: frontendUrl('/payments'), label: 'Pagar ahora' },
  });
  const text = `Deuda vencida: ${data.debtConcept} por ${formatCurrencyAr(data.amount, data.currency)}.`;
  return { subject, html, text };
}
