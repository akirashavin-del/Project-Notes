-- Supabase is the source of truth for authenticated project state.
create table if not exists public.projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled project',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.project_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('source', 'notes', 'latex', 'export', 'compiler-result')),
  path text not null,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.agent_runs enable row level security;
alter table public.project_artifacts enable row level security;

create policy "project owners can manage projects" on public.projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "project owners can manage agent runs" on public.agent_runs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "project owners can manage artifacts" on public.project_artifacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.touch_project_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
for each row execute function public.touch_project_updated_at();
