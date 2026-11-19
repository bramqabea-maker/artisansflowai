-- ArtisanFlow AI — schéma initial Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null,
  name text not null,
  email text not null,
  phone text,
  service text not null,
  description text not null,
  address text,
  status text not null default 'Nouveau' check (status in ('Nouveau','À contacter','Devis envoyé','En cours','Accepté','Refusé')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, reference)
);

create index if not exists leads_user_created_idx on public.leads(user_id, created_at desc);
alter table public.leads enable row level security;

drop policy if exists "Users can read their own leads" on public.leads;
create policy "Users can read their own leads" on public.leads for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their own leads" on public.leads;
create policy "Users can create their own leads" on public.leads for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own leads" on public.leads;
create policy "Users can update their own leads" on public.leads for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own leads" on public.leads;
create policy "Users can delete their own leads" on public.leads for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();

-- Important : cette version charge les données Supabase uniquement si une session
-- authentifiée existe. L'authentification Supabase doit être ajoutée/configurée
-- avant toute mise en production. Ne jamais désactiver RLS.
