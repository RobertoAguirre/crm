import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { sendEmail, welcomeHtml } from '../services/email.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['admin', 'manager', 'sales', 'viewer']).optional()
});

router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name, role: body.role || 'sales' }
    });

    if (error) return res.status(400).json({ error: error.message });

    const brand = (await supabaseAdmin.from('branding').select('company_name').limit(1).single()).data;

    try {
      await sendEmail({
        to: body.email,
        subject: `Bienvenido a ${brand?.company_name || 'CRM'}`,
        html: welcomeHtml(body.full_name, brand?.company_name)
      });
    } catch (e) {
      console.warn('Email bienvenida falló:', e.message);
    }

    const { data: session, error: signErr } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });
    if (signErr) return res.status(201).json({ user: data.user, message: 'Registrado; inicia sesión' });

    res.status(201).json({
      user: data.user,
      session: session.session,
      access_token: session.session?.access_token
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });
    if (error) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: data.user,
      profile,
      session: data.session,
      access_token: data.session.access_token
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user, profile: req.profile });
});

export default router;
