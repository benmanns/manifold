-- This file is autogenerated from regen-schema.ts
create table if not exists
  q_and_a_answers (
    id text not null,
    q_and_a_id text not null,
    user_id text not null,
    text text not null,
    award numeric default 0.0 not null,
    created_time timestamp with time zone default now() not null,
    deleted boolean default false not null
  );

-- Policies
alter table q_and_a_answers enable row level security;

drop policy if exists "public read" on q_and_a_answers;

create policy "public read" on q_and_a_answers for
select
  using (true);

-- Indexes
drop index if exists q_and_a_answers_pkey;

create unique index q_and_a_answers_pkey on public.q_and_a_answers using btree (id);
