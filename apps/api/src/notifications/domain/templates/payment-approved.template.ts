import { formatCurrencyAr, layout, RenderedEmail } from './base';

export interface PaymentApprovedData {
  recipientName: string;
  amount: number;
  currency?: string;
  concept: string;
  paymentId: string;
}

export function paymentApprovedTemplate(
  data: PaymentApprovedData,
): RenderedEmail {
  const subject = `Pago confirmado — ${formatCurrencyAr(data.amount, data.currency)}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Tu pago fue aprobado.</p>
    <ul>
      <li><strong>Concepto:</strong> ${data.concept}</li>
      <li><strong>Monto:</strong> ${formatCurrencyAr(data.amount, data.currency)}</li>
      <li><strong>ID de pago:</strong> ${data.paymentId}</li>
    </ul>
    <p>¡Gracias!</p>
  `;
  const html = layout({ title: 'Pago confirmado', body });
  const text = `Pago confirmado: ${data.concept} por ${formatCurrencyAr(data.amount, data.currency)}.`;
  return { subject, html, text };
}
