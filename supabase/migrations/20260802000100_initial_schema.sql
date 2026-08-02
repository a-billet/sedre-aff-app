-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  create type public.statut_analyse as enum ('brouillon', 'en_cours', 'finalisee');
exception
  when duplicate_object then
    null;
end;
$$;

do $$
begin
  create type public.criteria_type as enum ('select', 'checkbox', 'threshold', 'additive');
exception
  when duplicate_object then
    null;
end;
$$;

-- Profiles / users table (linked to auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scoring criteria
create table if not exists public.scoring_criteria (
  id uuid primary key default gen_random_uuid(),
  phase smallint not null check (phase in (1, 2, 3)),
  key text not null,
  label text not null,
  type public.criteria_type not null,
  weight numeric(8, 4) not null default 0,
  config jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase, key)
);

-- Scoring options
create table if not exists public.scoring_options (
  id uuid primary key default gen_random_uuid(),
  criteria_id uuid not null references public.scoring_criteria(id) on delete cascade,
  key text not null,
  label text not null,
  score numeric(10, 4) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (criteria_id, key)
);

-- Land entities
create table if not exists public.fonciers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  ville text,
  departement text,
  ref_cadastrale text,
  surface_m2 numeric(12, 2),
  prix_acquisition numeric(14, 2),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feasibility analyses
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  foncier_id uuid not null references public.fonciers(id) on delete cascade,
  statut public.statut_analyse not null default 'brouillon',
  scores_calcules jsonb not null default '{}'::jsonb,
  pre_bilan jsonb,
  cree_par uuid not null references auth.users(id) on delete restrict,
  modifie_par uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Detailed answers by criterion
create table if not exists public.analyse_reponses (
  id uuid primary key default gen_random_uuid(),
  analyse_id uuid not null references public.analyses(id) on delete cascade,
  critere_id uuid not null references public.scoring_criteria(id) on delete restrict,
  valeur jsonb not null,
  score_obtenu numeric(10, 4),
  created_at timestamptz not null default now(),
  unique (analyse_id, critere_id)
);

-- Change history (append-only by trigger)
create table if not exists public.analyse_historique (
  id uuid primary key default gen_random_uuid(),
  analyse_id uuid not null references public.analyses(id) on delete cascade,
  modifie_par uuid not null references auth.users(id) on delete restrict,
  champ_modifie text not null,
  valeur_avant jsonb,
  valeur_apres jsonb,
  modified_at timestamptz not null default now()
);

-- Useful indexes
create index if not exists idx_scoring_criteria_phase_sort on public.scoring_criteria (phase, sort_order);
create index if not exists idx_scoring_options_criteria_sort on public.scoring_options (criteria_id, sort_order);
create index if not exists idx_fonciers_created_by on public.fonciers (created_by);
create index if not exists idx_analyses_foncier_id on public.analyses (foncier_id);
create index if not exists idx_analyses_cree_par on public.analyses (cree_par);
create index if not exists idx_analyses_updated_at on public.analyses (updated_at desc);
create index if not exists idx_reponses_analyse on public.analyse_reponses (analyse_id);
create index if not exists idx_historique_analyse on public.analyse_historique (analyse_id, modified_at desc);
