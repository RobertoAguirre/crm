# CRM Monorepo

CRM en español (México) con **SvelteKit** (frontend), **Node/Express** (backend), **Supabase** (DB/Auth) y **Resend** (correos). Pensado para subir como monorepo a **Vercel**, con GitHub como eje (según tu arquitectura).

```
CRM/
├── frontend/          # SvelteKit
├── backend/           # Express API
├── supabase/          # Migraciones SQL
├── package.json       # Workspaces
└── vercel.json
```

## Módulos

- Registro / login
- Contactos (nombre, apellido, teléfono, compañía, dirección + mapa)
- Usuarios y roles (`admin`, `manager`, `sales`, `viewer`)
- Oportunidades por cliente en **MXN** o **USD**
- Branding propio (nombre y colores)
- Agenda / calendario + recordatorios por correo
- Notificaciones oportunas
- Dashboard lead → prospecto → cliente
- UI responsiva con animaciones

## Requisitos

- Node 20+
- Proyecto en [Supabase](https://supabase.com)
- API key de [Resend](https://resend.com) (100 correos/día en plan gratis)
- Cuenta Vercel + repo en GitHub

## 1. Supabase

1. Crea un proyecto.
2. En **SQL Editor**, ejecuta `supabase/migrations/001_initial.sql`.
3. Copia `Project URL`, `anon key` y `service_role key` (Settings → API).

## 2. Variables de entorno

```bash
cp .env.example .env
```

Completa `.env` y también crea `frontend/.env` con las variables `PUBLIC_*`:

```env
PUBLIC_API_URL=http://localhost:3001/api
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

El backend lee las variables sin el prefijo `PUBLIC_` desde la raíz (o `backend/.env`).

## 3. Instalar y correr en local

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001/api/health  

## 4. Deploy en Vercel (Services)

El repo usa **Vercel Services** (`vercel.json`): un proyecto, dos services.

| Service    | Root       | Público        | Notas                                      |
|------------|------------|----------------|--------------------------------------------|
| `backend`  | `backend/` | sí → `/api/*`  | Express (`src/app.js`)                     |
| `frontend` | `frontend/`| sí → `/*`      | SvelteKit; binding `BACKEND_URL` → backend |

1. Sube el repo a GitHub e importa el proyecto en Vercel (root del monorepo).
2. Configura env vars: `SUPABASE_*`, `RESEND_*`, `PUBLIC_API_URL=/api`, `PUBLIC_SUPABASE_*`.
3. **No** definas `BACKEND_URL`: Vercel la inyecta vía binding.
4. Local con bindings: `npx vercel dev` (o `npm run dev:vercel`).  
   Sin Vercel CLI: `npm run dev` (front :5173 + back :3001).

## Roles

| Rol       | Permisos principales                          |
|-----------|-----------------------------------------------|
| admin     | Todo + crear usuarios + branding              |
| manager   | Ver usuarios, operar CRM                      |
| sales     | Contactos, oportunidades, agenda              |
| viewer    | Lectura limitada                              |

## Stack de costos (referencia del diagrama)

| Pieza     | Notas                                      |
|-----------|--------------------------------------------|
| Cursor    | 0 limitado / ~350 ilimitado al mes         |
| GitHub    | Conecta todo                               |
| Vercel / Render | Hosting front (y opcional API)       |
| Supabase  | Base de datos + auth                       |
| Resend    | Correos · 100 diarios gratis               |
| Dominio   | ~1–200 USD/año según extensión             |

## Scripts

| Comando            | Descripción                |
|--------------------|----------------------------|
| `npm run dev`      | Front + back en paralelo   |
| `npm run build`    | Build de ambos             |
| `npm run dev:frontend` | Solo SvelteKit         |
| `npm run dev:backend`  | Solo API Node          |
