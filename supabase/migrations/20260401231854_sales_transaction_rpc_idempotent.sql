create or replace function public.create_sale_with_event(
  p_total numeric,
  p_organization_id uuid,
  p_idempotency_key text
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

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED';
  end if;

  select *
    into v_sale
  from sales
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key
  limit 1;

  if found then
    if v_sale.total <> p_total then
      raise exception 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD';
    end if;

    return to_json(v_sale);
  end if;

  insert into sales (
    organization_id,
    total,
    idempotency_key
  )
  values (
    p_organization_id,
    p_total,
    p_idempotency_key
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