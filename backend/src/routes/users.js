import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin', 'manager'), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const canSeeAll = req.profile?.role === 'admin' || req.profile?.role === 'manager';
  if (!canSeeAll && req.params.id !== req.user.id) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
});

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['admin', 'manager', 'sales', 'viewer']).optional(),
  is_active: z.boolean().optional(),
  avatar_url: z.string().url().optional().nullable()
});

router.patch('/:id', async (req, res) => {
  try {
    const body = updateSchema.parse(req.body);
    const isAdmin = req.profile?.role === 'admin';
    const isManager = req.profile?.role === 'manager';
    const isSelf = req.params.id === req.user.id;

    if (!isSelf && !isAdmin && !isManager) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (body.role && !isAdmin) {
      return res.status(403).json({ error: 'Solo admin cambia roles' });
    }
    if (body.is_active !== undefined && !isAdmin && !isManager) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['admin', 'manager', 'sales', 'viewer']).default('sales'),
  phone: z.string().optional()
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const body = createSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name, role: body.role }
    });
    if (error) return res.status(400).json({ error: error.message });

    if (body.phone) {
      await supabaseAdmin.from('profiles').update({ phone: body.phone }).eq('id', data.user.id);
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single();
    res.status(201).json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

export default router;
