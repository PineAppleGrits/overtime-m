/**
 * Tipo común de los templates: función pura `(data) => { subject, html, text }`.
 *
 * Convenciones:
 * - Mensajes en español rioplatense.
 * - HTML simple e inline (sin assets externos por ahora).
 * - `text` es fallback texto plano.
 * - Sin acoplamiento a infra ni a Prisma.
 */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const FRONTEND_URL_DEFAULT = 'http://localhost:3001';

export function frontendUrl(path = ''): string {
  const base = process.env.FRONTEND_URL || FRONTEND_URL_DEFAULT;
  return path ? `${base}${path}` : base;
}

export function layout(opts: {
  title: string;
  body: string;
  cta?: { url: string; label: string };
}): string {
  const cta = opts.cta
    ? `<p style="text-align:center;margin-top:24px;">
         <a href="${opts.cta.url}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;">${opts.cta.label}</a>
       </p>`
    : '';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#222;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#1a1a2e;color:#fff;padding:18px 24px;">
      <h1 style="margin:0;font-size:20px;">Overtime</h1>
    </div>
    <div style="padding:24px;">
      <h2 style="margin-top:0;font-size:18px;">${opts.title}</h2>
      ${opts.body}
      ${cta}
    </div>
    <div style="padding:14px 24px;font-size:11px;color:#888;border-top:1px solid #eee;">
      Este email fue enviado por Overtime.
    </div>
  </div>
</body></html>`;
}

export function formatDateAr(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrencyAr(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
}
