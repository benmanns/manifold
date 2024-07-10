-- This file is autogenerated from regen-schema.ts
create table if not exists
  contract_edits (
    id integer not null,
    contract_id text not null,
    editor_id text not null,
    data jsonb not null,
    idempotency_key text,
    created_time timestamp with time zone default now() not null,
    updated_keys text[]
  );

-- Policies
alter table contract_edits enable row level security;

drop policy if exists "public read" on contract_edits;

create policy "public read" on contract_edits for
select
  using (true);

-- Indexes
drop index if exists contract_edits_pkey;

create unique index contract_edits_pkey on public.contract_edits using btree (id);

drop index if exists contract_edits_contract_id_idx;

create index contract_edits_contract_id_idx on public.contract_edits using btree (contract_id);
