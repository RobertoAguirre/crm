import './env.js';
import app from './app.js';

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`CRM API en http://localhost:${port}/api · ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
});
