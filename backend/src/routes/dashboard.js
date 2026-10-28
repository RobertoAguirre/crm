import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/overview', async (_req, res) => {
  const [contacts, opportunities, events, recent] = await Promise.all([
    supabaseAdmin.from('contacts').select('id, stage'),
    supabaseAdmin.from('opportunities').select('id, amount, currency, status'),
    supabaseAdmin
      .from('events')
      .select('id, title, starts_at')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5),
    supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, company, stage, updated_at')
      .order('updated_at', { ascending: false })
      .limit(8)
  ]);

  if (contacts.error) return res.status(400).json({ error: contacts.error.message });

  const stages = { lead: 0, prospecto: 0, cliente: 0 };
  for (const c of contacts.data || []) {
    if (stages[c.stage] !== undefined) stages[c.stage]++;
  }

  const pipeline = { MXN: 0, USD: 0, won_mxn: 0, won_usd: 0, open: 0 };
  for (const o of opportunities.data || []) {
    if (o.status === 'open' || o.status === 'paused') {
      pipeline[o.currency] += Number(o.amount);
      pipeline.open++;
    }
    if (o.status === 'won') {
      if (o.currency === 'MXN') pipeline.won_mxn += Number(o.amount);
      else pipeline.won_usd += Number(o.amount);
    }
  }

  res.json({
    stages,
    total_contacts: contacts.data?.length || 0,
    pipeline,
    upcoming_events: events.data || [],
    recent_contacts: recent.data || []
  });
});

export default router;
