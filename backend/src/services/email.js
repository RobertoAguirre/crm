import '../env.js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM || 'CRM <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('[resend] Sin API key — correo simulado:', { to, subject });
    return { id: 'simulated', simulated: true };
  }

  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw error;
  return data;
}

export function welcomeHtml(name, brand = 'Mi CRM') {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h1 style="color:#0d9488">${brand}</h1>
      <p>Hola ${name || ''},</p>
      <p>Tu cuenta quedó lista. Ya puedes entrar al CRM y gestionar contactos, oportunidades y agenda.</p>
      <p style="color:#64748b;font-size:13px">Enviado desde México · ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
    </div>
  `;
}

export function reminderHtml(title, when, brand = 'Mi CRM') {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">${brand} · Recordatorio</h2>
      <p><strong>${title}</strong></p>
      <p>Fecha: ${when}</p>
    </div>
  `;
}
