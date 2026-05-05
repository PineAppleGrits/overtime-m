import { formatCurrencyAr, layout, RenderedEmail } from './base';

export interface DebtPaidData {
  recipientName: string;
  debtConcept: string;
  amount: number;
  currency?: string;
}

export function debtPaidTemplate(data: DebtPaidData): RenderedEmail {
  const subject = `Deuda saldada: ${data.debtConcept}`;
  const body = `
    <p>Hola ${data.recipientName},</p>
    <p>Confirmamos que se completó el pago de la siguiente deuda:</p>
    <ul>
      <li><strong>Concepto:</strong> ${data.debtConcept}</li>
      <li><strong>Monto total:</strong> ${formatCurrencyAr(data.amount, data.currency)}</li>
    </ul>
    <p>Gracias por regularizar tu situación.</p>
  `;
  const html = layout({ title: 'Deuda saldada', body });
  const text = `Deuda saldada: ${data.debtConcept} por ${formatCurrencyAr(data.amount, data.currency)}.`;
  return { subject, html, text };
}
