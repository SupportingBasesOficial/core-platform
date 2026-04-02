alter table sales
add column if not exists idempotency_key text;

create unique index if not exists unique_sales_org_idempotency
on sales (organization_id, idempotency_key);