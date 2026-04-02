create or replace function create_sale_with_event(
  p_total numeric,
  p_organization_id uuid
)
returns json
language plpgsql
security invoker
as $$
declare
  v_sale sales;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not exists (
    select 1
    from memberships
    where user_id = auth.uid()
      and organization_id = p_organization_id
  ) then
    raise exception 'FORBIDDEN';
  end if;

  insert into sales (
    organization_id,
    total
  )
  values (
    p_organization_id,
    p_total
  )
  returning * into v_sale;

  insert into events (
    type,
    payload,
    organization_id,
    status,
    attempts
  )
  values (
    'sale_created',
    to_jsonb(v_sale),
    p_organization_id,
    'pending',
    0
  );

  return to_json(v_sale);
end;
$$;