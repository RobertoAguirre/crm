import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../services/notify.js';
import { sendEmail, reminderHtml } from '../services/email.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
  all_day: z.boolean().optional(),
  contact_id: z.string().uuid().optional().nullable(),
  reminder_minutes: z.number().int().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable()
});

router.get('/', async (req, res) => {
  let q = supabaseAdmin
    .from('events')
    .select('*, contacts(first_name, last_name)')
    .order('starts_at', { ascending: true });
  if (req.query.from) q = q.gte('starts_at', req.query.from);
  if (req.query.to) q = q.lte('starts_at', req.query.to);
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  try {
    const body = schema.parse(req.body);
    const payload = { ...body, owner_id: body.owner_id || req.user.id };
    const { data, error } = await supabaseAdmin.from('events').insert(payload).select().single();
    if (error) return res.status(400).json({ error: error.message });

    await createNotification({
      userId: req.user.id,
      title: 'Evento agendado',
      body: data.title,
      type: 'reminder',
      link: '/agenda'
    }).catch(() => {});

    res.status(201).json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = schema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('events')
      .update(body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('events').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

router.post('/:id/remind', async (req, res) => {
  const { data: event, error } = await supabaseAdmin.from('events').select('*').eq('id', req.params.id).single();
  if (error || !event) return res.status(404).json({ error: 'Evento no encontrado' });

  const brand = (await supabaseAdmin.from('branding').select('company_name').limit(1).single()).data;
  const when = new Date(event.starts_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

  try {
    await sendEmail({
      to: req.user.email,
      subject: `Recordatorio: ${event.title}`,
      html: reminderHtml(event.title, when, brand?.company_name)
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }

  await createNotification({
    userId: req.user.id,
    title: 'Recordatorio enviado',
    body: event.title,
    type: 'email',
    link: '/agenda'
  }).catch(() => {});

  res.json({ ok: true });
});

export default router;
