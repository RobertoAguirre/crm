import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';
import { createNotification } from '../services/notify.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  contact_id: z.string().uuid().optional()
});

router.post('/send', async (req, res) => {
  try {
    const body = schema.parse(req.body);
    const brand = (await supabaseAdmin.from('branding').select('company_name').limit(1).single()).data;

    const result = await sendEmail({
      to: body.to,
      subject: `[${brand?.company_name || 'CRM'}] ${body.subject}`,
      html: body.html
    });

    await createNotification({
      userId: req.user.id,
      title: 'Correo enviado',
      body: `${body.subject} → ${body.to}`,
      type: 'email',
      link: body.contact_id ? `/contactos/${body.contact_id}` : undefined
    }).catch(() => {});

    res.json({ ok: true, result });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(502).json({ error: err.message || 'Error al enviar correo' });
  }
});

export default router;
