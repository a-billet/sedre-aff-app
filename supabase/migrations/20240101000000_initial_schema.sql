-- Migration: schéma initial
-- Créé le 2024-01-01
-- Supabase / PostgreSQL

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type statut_grille  as enum ('brouillon', 'active', 'archivee');
create type statut_analyse as enum ('brouillon', 'en_cours', 'finalisee');
create type type_saisie    as enum ('qualitatif', 'quantitatif');

-- ============================================================
-- TABLE users
-- Mirror de auth.users avec les champs applicatifs.
-- Alimentée automatiquement via trigger sur auth.users.
-- ============================================================
create table public.users (
  id              uuid        primary key references auth.users(id) on delete cascade,
  email           text        not null,
  is_super_admin  boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Trigger : créer une ligne dans public.users dès qu'un utilisateur s'inscrit
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLE criteres
-- Catalogue des critères d'évaluation. Modifiable uniquement
-- par un super-admin via RLS.
-- ============================================================
create table public.criteres (
  id          uuid        primary key default gen_random_uuid(),
  categorie   text        not null,
  libelle     text        not null,
  ordre       integer     not null default 0,
  type_saisie type_saisie not null default 'qualitatif',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE grille_versions
-- Chaque version représente un "snapshot" de la grille de
-- notation. On ne modifie jamais une version active — on en
-- crée une nouvelle en brouillon, puis on la publie.
-- ============================================================
create table public.grille_versions (
  id           uuid          primary key default gen_random_uuid(),
  statut       statut_grille not null default 'brouillon',
  description  text,
  published_at timestamptz,
  created_by   uuid          not null references public.users(id),
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

-- Contrainte : une seule version active à la fois
create unique index grille_versions_unique_active
  on public.grille_versions (statut)
  where statut = 'active';

-- ============================================================
-- TABLE grille_ponderations
-- Poids de chaque critère et ses seuils de score associés
-- pour une version de grille donnée.
-- ============================================================
create table public.grille_ponderations (
  id                uuid        primary key default gen_random_uuid(),
  grille_version_id uuid        not null references public.grille_versions(id) on delete cascade,
  critere_id        uuid        not null references public.criteres(id) on delete restrict,
  poids             numeric(5,2) not null check (poids >= 0 and poids <= 100),
  -- seuils : { options: [{ valeur, score }] } ou { min, max, score }
  seuils            jsonb       not null default '{}',
  created_at        timestamptz not null default now(),
  unique (grille_version_id, critere_id)
);

-- ============================================================
-- TABLE fonciers
-- Données descriptives du terrain analysé.
-- ============================================================
create table public.fonciers (
  id              uuid        primary key default gen_random_uuid(),
  nom             text        not null,
  adresse         text,
  ville           text,
  departement     text,
  ref_cadastrale  text,
  surface_m2      numeric(12,2),
  prix_acquisition numeric(15,2),
  created_by      uuid        not null references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE analyses
-- Résultat d'une évaluation d'un foncier sur une grille donnée.
-- Le score calculé est stocké explicitement — jamais recalculé
-- silencieusement si la grille change ultérieurement.
-- ============================================================
create table public.analyses (
  id                uuid          primary key default gen_random_uuid(),
  foncier_id        uuid          not null references public.fonciers(id) on delete restrict,
  grille_version_id uuid          not null references public.grille_versions(id) on delete restrict,
  statut            statut_analyse not null default 'brouillon',
  -- scores_calcules : { phase1, phase2, phase3, global, recommandation }
  scores_calcules   jsonb         not null default '{}',
  -- pre_bilan : résultat du calcul économique (mode aménagement / construction)
  pre_bilan         jsonb,
  cree_par          uuid          not null references public.users(id),
  modifie_par       uuid          not null references public.users(id),
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);

-- ============================================================
-- TABLE analyse_reponses
-- Réponses brutes par critère pour une analyse.
-- Permet de reconstituer le détail sans recalculer.
-- ============================================================
create table public.analyse_reponses (
  id          uuid        primary key default gen_random_uuid(),
  analyse_id  uuid        not null references public.analyses(id) on delete cascade,
  critere_id  uuid        not null references public.criteres(id) on delete restrict,
  valeur      jsonb       not null,
  score_obtenu numeric(5,2),
  created_at  timestamptz not null default now(),
  unique (analyse_id, critere_id)
);

-- ============================================================
-- TABLE analyse_historique
-- Log immuable des modifications d'analyses.
-- Alimenté uniquement par trigger Postgres — jamais par
-- l'application directement.
-- ============================================================
create table public.analyse_historique (
  id            uuid        primary key default gen_random_uuid(),
  analyse_id    uuid        not null references public.analyses(id) on delete cascade,
  modifie_par   uuid        not null references public.users(id),
  champ_modifie text        not null,
  valeur_avant  jsonb,
  valeur_apres  jsonb,
  modified_at   timestamptz not null default now()
);

-- Trigger : enregistrer les modifications d'analyses
create or replace function public.log_analyse_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  champ text;
  tracked_fields text[] := array[
    'statut', 'scores_calcules', 'pre_bilan', 'modifie_par'
  ];
begin
  foreach champ in array tracked_fields loop
    if row_to_json(old) -> champ IS DISTINCT FROM row_to_json(new) -> champ then
      insert into public.analyse_historique (
        analyse_id,
        modifie_par,
        champ_modifie,
        valeur_avant,
        valeur_apres
      ) values (
        new.id,
        new.modifie_par,
        champ,
        row_to_json(old) -> champ,
        row_to_json(new) -> champ
      );
    end if;
  end loop;
  return new;
end;
$$;

create trigger on_analyse_updated
  after update on public.analyses
  for each row execute procedure public.log_analyse_update();

-- ============================================================
-- INDEXES
-- ============================================================
create index analyses_foncier_id_idx       on public.analyses(foncier_id);
create index analyses_grille_version_idx   on public.analyses(grille_version_id);
create index analyses_cree_par_idx         on public.analyses(cree_par);
create index analyse_reponses_analyse_idx  on public.analyse_reponses(analyse_id);
create index analyse_historique_analyse_idx on public.analyse_historique(analyse_id);
create index grille_ponderations_version_idx on public.grille_ponderations(grille_version_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- users -------------------------------------------------------
alter table public.users enable row level security;

-- Chaque utilisateur voit uniquement sa propre ligne
create policy "users: select own row"
  on public.users for select
  using (auth.uid() = id);

-- Seul le super-admin peut voir tous les utilisateurs
create policy "users: super-admin sees all"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_super_admin = true
    )
  );

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_super_admin = (select is_super_admin from public.users where id = auth.uid()));

-- criteres ----------------------------------------------------
alter table public.criteres enable row level security;

create policy "criteres: authenticated can read"
  on public.criteres for select
  using (auth.role() = 'authenticated');

create policy "criteres: only super-admin can write"
  on public.criteres for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_super_admin = true
    )
  );

-- grille_versions ---------------------------------------------
alter table public.grille_versions enable row level security;

create policy "grille_versions: authenticated can read"
  on public.grille_versions for select
  using (auth.role() = 'authenticated');

create policy "grille_versions: only super-admin can write"
  on public.grille_versions for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_super_admin = true
    )
  );

-- grille_ponderations -----------------------------------------
alter table public.grille_ponderations enable row level security;

create policy "grille_ponderations: authenticated can read"
  on public.grille_ponderations for select
  using (auth.role() = 'authenticated');

create policy "grille_ponderations: only super-admin can write"
  on public.grille_ponderations for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_super_admin = true
    )
  );

-- fonciers ----------------------------------------------------
alter table public.fonciers enable row level security;

create policy "fonciers: authenticated can read all"
  on public.fonciers for select
  using (auth.role() = 'authenticated');

create policy "fonciers: authenticated can insert"
  on public.fonciers for insert
  with check (auth.uid() = created_by);

create policy "fonciers: authenticated can update"
  on public.fonciers for update
  using (auth.role() = 'authenticated');

-- analyses ----------------------------------------------------
alter table public.analyses enable row level security;

create policy "analyses: authenticated can read all"
  on public.analyses for select
  using (auth.role() = 'authenticated');

create policy "analyses: authenticated can insert"
  on public.analyses for insert
  with check (auth.uid() = cree_par);

create policy "analyses: authenticated can update"
  on public.analyses for update
  using (auth.role() = 'authenticated');

-- analyse_reponses --------------------------------------------
alter table public.analyse_reponses enable row level security;

create policy "analyse_reponses: authenticated can read"
  on public.analyse_reponses for select
  using (auth.role() = 'authenticated');

create policy "analyse_reponses: authenticated can write"
  on public.analyse_reponses for all
  using (auth.role() = 'authenticated');

-- analyse_historique ------------------------------------------
alter table public.analyse_historique enable row level security;

-- Log en lecture seule pour les utilisateurs authentifiés
create policy "analyse_historique: authenticated can read"
  on public.analyse_historique for select
  using (auth.role() = 'authenticated');

-- Pas de policy insert/update/delete intentionnellement
-- (seul le trigger security definer peut insérer)
