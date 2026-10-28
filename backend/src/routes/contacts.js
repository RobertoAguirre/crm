import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../services/notify.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  stage: z.enum(['lead', 'prospecto', 'cliente']).optional(),
  business_address: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable()
});

router.get('/', async (req, res) => {
  const stage = req.query.stage;
  let q = supabaseAdmin.from('contacts').select('*').order('updated_at', { ascending: false });
  if (stage) q = q.eq('stage', stage);
  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('contacts').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Contacto no encontrado' });
  res.json(data);
});

router.post('/', async (req, res) => {
  try {
    const body = schema.parse(req.body);
    const payload = {
      ...body,
      email: body.email || null,
      owner_id: body.owner_id || req.user.id,
      stage: body.stage || 'lead'
    };
    const { data, error } = await supabaseAdmin.from('contacts').insert(payload).select().single();
    if (error) return res.status(400).json({ error: error.message });

    await createNotification({
      userId: req.user.id,
      title: 'Contacto creado',
      body: `${data.first_name} ${data.last_name} · ${data.stage}`,
      type: 'success',
      link: `/contactos/${data.id}`
    }).catch(() => {});

    res.status(201).json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear contacto' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = schema.partial().parse(req.body);
    const { data: prev } = await supabaseAdmin.from('contacts').select('stage, first_name, last_name').eq('id', req.params.id).single();
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .update(body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    if (prev && body.stage && body.stage !== prev.stage) {
      await createNotification({
        userId: req.user.id,
        title: 'Evolución de contacto',
        body: `${prev.first_name} ${prev.last_name}: ${prev.stage} → ${body.stage}`,
        type: 'info',
        link: `/contactos/${data.id}`
      }).catch(() => {});
    }

    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('contacts').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
