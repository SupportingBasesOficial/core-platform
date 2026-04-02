alter table dead_events enable row level security;

drop policy if exists "dead_events_select_same_org" on dead_events;
create policy "dead_events_select_same_org"
on dead_events
for select
using (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);

drop policy if exists "dead_events_insert_same_org" on dead_events;
create policy "dead_events_insert_same_org"
on dead_events
for insert
with check (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);