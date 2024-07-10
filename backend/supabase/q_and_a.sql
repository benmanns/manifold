-- This file is autogenerated from regen-schema.ts
create table if not exists
  q_and_a (
    id text not null,
    user_id text not null,
    question text not null,
    description text not null,
    bounty numeric not null,
    created_time timestamp with time zone default now() not null,
    deleted boolean default false not null
  );

-- Policies
alter table q_and_a enable row level security;

drop policy if exists "public read" on q_and_a;

create policy "public read" on q_and_a for
select
  using (true);

-- Indexes
drop index if exists q_and_a_pkey;

create unique index q_and_a_pkey on public.q_and_a using btree (id);
