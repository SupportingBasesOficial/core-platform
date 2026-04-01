create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  permission text not null,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  total numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb,
  organization_id uuid not null references organizations(id) on delete cascade,
  status text not null default 'pending',
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table memberships enable row level security;
alter table sales enable row level security;
alter table events enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "memberships_select_own" on memberships;
create policy "memberships_select_own"
on memberships
for select
using (user_id = auth.uid());

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
on profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
on profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "sales_select_same_org" on sales;
create policy "sales_select_same_org"
on sales
for select
using (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);

drop policy if exists "sales_insert_same_org" on sales;
create policy "sales_insert_same_org"
on sales
for insert
with check (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);

drop policy if exists "events_select_same_org" on events;
create policy "events_select_same_org"
on events
for select
using (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);

drop policy if exists "events_insert_same_org" on events;
create policy "events_insert_same_org"
on events
for insert
with check (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);

drop policy if exists "audit_logs_select_own" on audit_logs;
create policy "audit_logs_select_own"
on audit_logs
for select
using (user_id = auth.uid());

drop policy if exists "audit_logs_insert_own" on audit_logs;
create policy "audit_logs_insert_own"
on audit_logs
for insert
with check (user_id = auth.uid());