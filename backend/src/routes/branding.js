import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('branding').select('*').limit(1).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.use(requireAuth);

const schema = z.object({
  company_name: z.string().min(1).optional(),
  logo_url: z.string().url().optional().nullable(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  accent_color: z.string().optional()
});

router.patch('/', requireRole('admin'), async (req, res) => {
  try {
    const body = schema.parse(req.body);
    const { data: current } = await supabaseAdmin.from('branding').select('id').limit(1).single();
    if (!current) return res.status(404).json({ error: 'Branding no encontrado' });

    const { data, error } = await supabaseAdmin
      .from('branding')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar branding' });
  }
});

export default router;
