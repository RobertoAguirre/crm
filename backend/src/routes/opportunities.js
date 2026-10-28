import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../services/notify.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  contact_id: z.string().uuid(),
  title: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.enum(['MXN', 'USD']).default('MXN'),
  status: z.enum(['open', 'won', 'lost', 'paused']).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expected_close: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable()
});

router.get('/', async (req, res) => {
  let q = supabaseAdmin
    .from('opportunities')
    .select('*, contacts(first_name, last_name, company, stage)')
    .order('updated_at', { ascending: false });
  if (req.query.contact_id) q = q.eq('contact_id', req.query.contact_id);
  if (req.query.status) q = q.eq('status', req.query.status);
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  try {
    const body = schema.parse(req.body);
    const payload = { ...body, owner_id: body.owner_id || req.user.id };
    const { data, error } = await supabaseAdmin.from('opportunities').insert(payload).select().single();
    if (error) return res.status(400).json({ error: error.message });

    await createNotification({
      userId: req.user.id,
      title: 'Nueva oportunidad',
      body: `${data.title} · ${data.amount} ${data.currency}`,
      type: 'success',
      link: `/oportunidades`
    }).catch(() => {});

    res.status(201).json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear oportunidad' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = schema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('opportunities')
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
  const { error } = await supabaseAdmin.from('opportunities').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
