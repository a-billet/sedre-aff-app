-- Helper: updated_at timestamp maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_scoring_criteria_updated_at on public.scoring_criteria;
create trigger trg_scoring_criteria_updated_at
before update on public.scoring_criteria
for each row
execute function public.set_updated_at();

drop trigger if exists trg_fonciers_updated_at on public.fonciers;
create trigger trg_fonciers_updated_at
before update on public.fonciers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_analyses_updated_at on public.analyses;
create trigger trg_analyses_updated_at
before update on public.analyses
for each row
execute function public.set_updated_at();

-- Helper: create public.users row automatically after auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Helper: audit analysis updates
create or replace function public.log_analyse_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_jsonb(old) is distinct from to_jsonb(new) then
    insert into public.analyse_historique (
      analyse_id,
      modifie_par,
      champ_modifie,
      valeur_avant,
      valeur_apres,
      modified_at
    )
    values (
      old.id,
      coalesce(new.modifie_par, auth.uid()),
      'full_row',
      to_jsonb(old),
      to_jsonb(new),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_analyses_audit_update on public.analyses;
create trigger trg_analyses_audit_update
after update on public.analyses
for each row
execute function public.log_analyse_update();

-- Enable RLS
alter table public.users enable row level security;
alter table public.scoring_criteria enable row level security;
alter table public.scoring_options enable row level security;
alter table public.fonciers enable row level security;
alter table public.analyses enable row level security;
alter table public.analyse_reponses enable row level security;
alter table public.analyse_historique enable row level security;

-- USERS policies: each user can read/update own profile
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
to authenticated
using (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- SCORING policies: everyone authenticated can read, only super admins can write
drop policy if exists "criteria_read_authenticated" on public.scoring_criteria;
create policy "criteria_read_authenticated"
on public.scoring_criteria
for select
to authenticated
using (true);

drop policy if exists "options_read_authenticated" on public.scoring_options;
create policy "options_read_authenticated"
on public.scoring_options
for select
to authenticated
using (true);

drop policy if exists "criteria_write_super_admin" on public.scoring_criteria;
create policy "criteria_write_super_admin"
on public.scoring_criteria
for all
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.is_super_admin = true
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.is_super_admin = true
  )
);

drop policy if exists "options_write_super_admin" on public.scoring_options;
create policy "options_write_super_admin"
on public.scoring_options
for all
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.is_super_admin = true
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.is_super_admin = true
  )
);

-- FONCIERS policies: owner-only CRUD
drop policy if exists "fonciers_select_owner" on public.fonciers;
create policy "fonciers_select_owner"
on public.fonciers
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "fonciers_insert_owner" on public.fonciers;
create policy "fonciers_insert_owner"
on public.fonciers
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "fonciers_update_owner" on public.fonciers;
create policy "fonciers_update_owner"
on public.fonciers
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "fonciers_delete_owner" on public.fonciers;
create policy "fonciers_delete_owner"
on public.fonciers
for delete
to authenticated
using (created_by = auth.uid());

-- ANALYSES policies: owner-only CRUD + relation to owned foncier
drop policy if exists "analyses_select_owner" on public.analyses;
create policy "analyses_select_owner"
on public.analyses
for select
to authenticated
using (cree_par = auth.uid());

drop policy if exists "analyses_insert_owner" on public.analyses;
create policy "analyses_insert_owner"
on public.analyses
for insert
to authenticated
with check (
  cree_par = auth.uid()
  and modifie_par = auth.uid()
  and exists (
    select 1
    from public.fonciers f
    where f.id = foncier_id and f.created_by = auth.uid()
  )
);

drop policy if exists "analyses_update_owner" on public.analyses;
create policy "analyses_update_owner"
on public.analyses
for update
to authenticated
using (cree_par = auth.uid())
with check (
  cree_par = auth.uid()
  and modifie_par = auth.uid()
  and exists (
    select 1
    from public.fonciers f
    where f.id = foncier_id and f.created_by = auth.uid()
  )
);

drop policy if exists "analyses_delete_owner" on public.analyses;
create policy "analyses_delete_owner"
on public.analyses
for delete
to authenticated
using (cree_par = auth.uid());

-- REPONSES policies: follow ownership through analyses
drop policy if exists "reponses_select_owner" on public.analyse_reponses;
create policy "reponses_select_owner"
on public.analyse_reponses
for select
to authenticated
using (
  exists (
    select 1
    from public.analyses a
    where a.id = analyse_id and a.cree_par = auth.uid()
  )
);

drop policy if exists "reponses_insert_owner" on public.analyse_reponses;
create policy "reponses_insert_owner"
on public.analyse_reponses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.analyses a
    where a.id = analyse_id and a.cree_par = auth.uid()
  )
);

drop policy if exists "reponses_update_owner" on public.analyse_reponses;
create policy "reponses_update_owner"
on public.analyse_reponses
for update
to authenticated
using (
  exists (
    select 1
    from public.analyses a
    where a.id = analyse_id and a.cree_par = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.analyses a
    where a.id = analyse_id and a.cree_par = auth.uid()
  )
);

drop policy if exists "reponses_delete_owner" on public.analyse_reponses;
create policy "reponses_delete_owner"
on public.analyse_reponses
for delete
to authenticated
using (
  exists (
    select 1
    from public.analyses a
    where a.id = analyse_id and a.cree_par = auth.uid()
  )
);

-- HISTORIQUE policies: read-only to owner, no direct writes from clients
drop policy if exists "historique_select_owner" on public.analyse_historique;
create policy "historique_select_owner"
on public.analyse_historique
for select
to authenticated
using (
  exists (
    select 1
    from public.analyses a
    where a.id = analyse_id and a.cree_par = auth.uid()
  )
);

-- Optional bootstrap command (run manually once in SQL editor):
-- update public.users set is_super_admin = true where email = 'ton-email@domaine.com';
