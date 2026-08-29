-- GitHub is the first artifact store. This migration keeps storage provider details
-- separate from project state so a later move to Supabase Storage or S3-compatible
-- object storage only changes object locations, not the notebook data model.

create table if not exists public.storage_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'github' check (provider in ('github', 'supabase', 's3', 'inline')),
  namespace text not null default 'project-notes',
  object_key text not null,
  content_hash text,
  byte_size bigint,
  content_type text not null default 'text/plain',
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, provider, namespace, object_key)
);

alter table public.project_artifacts
  add column if not exists storage_object_id uuid references public.storage_objects(id) on delete set null,
  add column if not exists storage_provider text not null default 'github',
  add column if not exists storage_key text,
  add column if not exists storage_url text,
  add column if not exists content_hash text,
  add column if not exists byte_size bigint,
  add column if not exists content_type text not null default 'text/plain';

alter table public.project_artifacts
  drop constraint if exists project_artifacts_storage_provider_check;

alter table public.project_artifacts
  add constraint project_artifacts_storage_provider_check
  check (storage_provider in ('github', 'supabase', 's3', 'inline'));

-- Do not label any pre-existing inline rows as GitHub objects until they are
-- actually copied and linked by the export backfill.
update public.project_artifacts
set storage_provider = 'inline'
where storage_key is null and content is not null;

create table if not exists public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision_number integer not null,
  storage_object_id uuid references public.storage_objects(id) on delete set null,
  manifest jsonb not null default '{}'::jsonb,
  source_commit_sha text,
  created_at timestamptz not null default now(),
  unique (project_id, revision_number)
);

create table if not exists public.project_exports (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'github' check (provider in ('github', 'supabase', 's3')),
  repository text,
  branch text,
  commit_sha text,
  manifest jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'succeeded', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.storage_objects enable row level security;
alter table public.project_revisions enable row level security;
alter table public.project_exports enable row level security;

drop policy if exists "owners can manage storage objects" on public.storage_objects;
create policy "owners can manage storage objects" on public.storage_objects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "project owners can manage revisions" on public.project_revisions;
create policy "project owners can manage revisions" on public.project_revisions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "project owners can manage exports" on public.project_exports;
create policy "project owners can manage exports" on public.project_exports
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index if not exists storage_objects_owner_idx on public.storage_objects(owner_id, updated_at desc);
create index if not exists project_revisions_project_idx on public.project_revisions(project_id, revision_number desc);
create index if not exists project_exports_project_idx on public.project_exports(project_id, created_at desc);

create or replace function public.touch_storage_object_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists storage_objects_updated_at on public.storage_objects;
create trigger storage_objects_updated_at before update on public.storage_objects
for each row execute function public.touch_storage_object_updated_at();

-- Future cloud cutover procedure:
-- 1. Copy each GitHub object to the new provider.
-- 2. Insert/update storage_objects with provider='supabase' or provider='s3'.
-- 3. Update project_artifacts.storage_object_id, storage_provider, storage_key,
--    storage_url, content_hash, and byte_size in one controlled backfill.
-- 4. Keep the GitHub object until verification and rollback retention complete.
