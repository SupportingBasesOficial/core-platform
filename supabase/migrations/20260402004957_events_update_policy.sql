drop policy if exists "events_update_same_org" on events;

create policy "events_update_same_org"
on events
for update
using (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
)
with check (
  organization_id in (
    select organization_id
    from memberships
    where user_id = auth.uid()
  )
);