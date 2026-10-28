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

## 4. Deploy en Vercel (monorepo)

1. Sube el repo a GitHub.
2. Importa el proyecto en Vercel.
3. Configura env vars (`SUPABASE_*`, `RESEND_*`, `PUBLIC_API_URL`, etc.).
4. En producción, `PUBLIC_API_URL` puede ser `/api` si sirves backend y frontend juntos, o la URL del servicio Node.

> En el diagrama aparece **Render ($7/mes)** para hospedar el backend. Si prefieres esa variante: despliega `backend/` en Render y `frontend/` en Vercel, apuntando `PUBLIC_API_URL` a la URL de Render.

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
