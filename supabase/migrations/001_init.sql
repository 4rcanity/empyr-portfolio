-- Empyr SaaS skeleton — initial schema
-- Tables: users, generated_sites

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  prompt text not null,
  layout_json jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists generated_sites_user_slug_uidx
  on public.generated_sites (user_id, slug)
  where slug is not null;

create index if not exists generated_sites_user_id_idx
  on public.generated_sites (user_id);

create index if not exists generated_sites_layout_gin
  on public.generated_sites using gin (layout_json);

-- Row Level Security (skeleton)
--
-- Phase 2 default: server routes authenticate via Clerk `auth()` first,
-- then use the Supabase service role key (which bypasses RLS) to perform
-- reads/writes. RLS is enabled below as defense-in-depth for any future
-- client-side Supabase access, but no `auth.jwt()`-based policies are
-- defined yet because Clerk <-> Supabase JWT bridging is out of scope for
-- this skeleton (see plan §9). Until that bridge exists, only the service
-- role (which bypasses RLS entirely) can read/write these tables.

alter table public.users enable row level security;
alter table public.generated_sites enable row level security;

-- Keep updated_at fresh on row mutation.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

drop trigger if exists generated_sites_set_updated_at on public.generated_sites;
create trigger generated_sites_set_updated_at
  before update on public.generated_sites
  for each row
  execute function public.set_updated_at();
