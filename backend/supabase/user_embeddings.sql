-- This file is autogenerated from regen-schema.ts
create table if not exists
  user_embeddings (
    user_id text not null,
    created_at timestamp without time zone default now() not null,
    interest_embedding vector (1536) not null,
    contract_view_embedding vector (1536),
    disinterest_embedding vector (1536)
  );

-- Policies
alter table user_embeddings enable row level security;

drop policy if exists "admin write access" on user_embeddings;

create policy "admin write access" on user_embeddings for all;

drop policy if exists "public read" on user_embeddings;

create policy "public read" on user_embeddings for
select
  using (true);

-- Indexes
drop index if exists user_embeddings_pkey;

create unique index user_embeddings_pkey on public.user_embeddings using btree (user_id);
