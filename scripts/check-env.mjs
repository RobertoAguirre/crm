import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(path.join(root, '.env.example'), envPath);
  console.log('✓ Creado .env desde .env.example');
}

const env = fs.readFileSync(envPath, 'utf8');
const missing = [];
for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
  const val = m?.[1]?.trim() || '';
  if (!val || val.includes('tu-proyecto') || val.includes('tu_anon') || val.includes('tu_service')) {
    missing.push(key);
  }
}

console.log('');
console.log('CRM local — front + back en tu máquina; DB en Supabase');
console.log('─────────────────────────────────────────────────────');
if (missing.length) {
  console.log('⚠ Falta configurar en .env:');
  for (const k of missing) console.log(`   - ${k}`);
  console.log('');
  console.log('1. Abre https://supabase.com/dashboard → tu proyecto → Settings → API');
  console.log('2. Pega URL, anon key y service_role en .env (y PUBLIC_SUPABASE_*)');
  console.log('3. En SQL Editor ejecuta: supabase/migrations/001_initial.sql');
  console.log('4. Luego: npm run dev');
  console.log('');
  process.exitCode = 0;
} else {
  console.log('✓ Variables de Supabase detectadas');
  console.log('  Arranca con: npm run dev');
  console.log('  Front http://localhost:5173  ·  API http://localhost:3001/api/health');
  console.log('');
}
