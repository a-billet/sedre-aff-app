-- Paramètres réutilisables dans les analyses
create table if not exists public.analysis_default_criteria (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  value numeric(14, 2),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_analysis_default_criteria_sort on public.analysis_default_criteria (sort_order);

alter table public.analysis_default_criteria enable row level security;

drop policy if exists "analysis_default_criteria_read_authenticated" on public.analysis_default_criteria;
create policy "analysis_default_criteria_read_authenticated"
on public.analysis_default_criteria
for select
to authenticated
using (true);

drop policy if exists "analysis_default_criteria_write_super_admin" on public.analysis_default_criteria;
create policy "analysis_default_criteria_write_super_admin"
on public.analysis_default_criteria
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

insert into public.analysis_default_criteria (key, label, value, sort_order, active)
values ('mise_en_etat_sols', 'Mise en état des sols', null, 1, true)
on conflict (key) do nothing;