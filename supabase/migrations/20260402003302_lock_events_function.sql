create or replace function public.lock_events(limit_count integer default 10)
returns setof events
language sql
security invoker
as $$
  update events
  set status = 'processing'
  where id in (
    select id
    from events
    where status = 'pending'
      and (next_retry_at is null or next_retry_at <= now())
    order by created_at asc
    limit limit_count
    for update skip locked
  )
  returning *;
$$;