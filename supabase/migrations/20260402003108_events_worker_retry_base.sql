alter table events
add column if not exists next_retry_at timestamptz,
add column if not exists max_attempts integer not null default 5,
add column if not exists processed_at timestamptz;

create index if not exists idx_events_status_next_retry
on events (status, next_retry_at, created_at);