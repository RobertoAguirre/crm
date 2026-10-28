import './env.js';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import usersRoutes from './routes/users.js';
import opportunitiesRoutes from './routes/opportunities.js';
import eventsRoutes from './routes/events.js';
import notificationsRoutes from './routes/notifications.js';
import brandingRoutes from './routes/branding.js';
import dashboardRoutes from './routes/dashboard.js';
import emailRoutes from './routes/email.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || true,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'crm-backend',
    tz: 'America/Mexico_City',
    time: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

export default app;
