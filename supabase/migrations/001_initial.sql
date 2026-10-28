-- CRM Schema — México / UTC-6
-- Roles: admin | manager | sales | viewer
-- Etapas contacto: lead → prospecto → cliente

create extension if not exists "pgcrypto";

-- Branding del CRM
create table if not exists public.branding (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Mi CRM',
  logo_url text,
  primary_color text not null default '#0d9488',
  secondary_color text not null default '#0f172a',
  accent_color text not null default '#f59e0b',
  updated_at timestamptz not null default now()
);

insert into public.branding (company_name)
select 'Mi CRM'
where not exists (select 1 from public.branding);

-- Perfiles (vinculados a auth.users de Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text,
  role text not null default 'sales'
    check (role in ('admin', 'manager', 'sales', 'viewer')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contactos
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text,
  company text,
  email text,
  stage text not null default 'lead'
    check (stage in ('lead', 'prospecto', 'cliente')),
  business_address text,
  lat double precision,
  lng double precision,
  notes text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_stage_idx on public.contacts(stage);
create index if not exists contacts_owner_idx on public.contacts(owner_id);

-- Oportunidades
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  title text not null,
  amount numeric(14, 2) not null default 0,
  currency text not null default 'MXN' check (currency in ('MXN', 'USD')),
  status text not null default 'open'
    check (status in ('open', 'won', 'lost', 'paused')),
  probability int not null default 50 check (probability between 0 and 100),
  expected_close date,
  owner_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_contact_idx on public.opportunities(contact_id);

-- Agenda / calendario
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  reminder_minutes int default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_idx on public.events(starts_at);

-- Notificaciones
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info'
    check (type in ('info', 'success', 'warning', 'reminder', 'email')),
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, read);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'sales')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger opportunities_updated before update on public.opportunities
  for each row execute function public.set_updated_at();
create trigger events_updated before update on public.events
  for each row execute function public.set_updated_at();

-- RLS básico
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.branding enable row level security;

create policy "profiles_select_auth" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager')
  ));

create policy "contacts_all_auth" on public.contacts for all to authenticated using (true) with check (true);
create policy "opportunities_all_auth" on public.opportunities for all to authenticated using (true) with check (true);
create policy "events_all_auth" on public.events for all to authenticated using (true) with check (true);
create policy "notifications_own" on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "branding_select" on public.branding for select to authenticated using (true);
create policy "branding_admin" on public.branding for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
