-- This file is autogenerated from regen-schema.ts
create table if not exists
  audit_events (
    id bigint not null,
    created_time timestamp with time zone default now() not null,
    name text not null,
    user_id text not null,
    contract_id text,
    comment_id text,
    data jsonb
  );

-- Policies
alter table audit_events enable row level security;

drop policy if exists "public read" on audit_events;

create policy "public read" on audit_events for
select
  using (true);

-- Indexes
drop index if exists audit_events_pkey;

create unique index audit_events_pkey on public.audit_events using btree (id);
