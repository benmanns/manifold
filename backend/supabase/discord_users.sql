-- This file is autogenerated from regen-schema.ts
create table if not exists
  discord_users (
    discord_user_id text not null,
    api_key text not null,
    user_id text
  );

-- Indexes
drop index if exists discord_users_pkey;

create unique index discord_users_pkey on public.discord_users using btree (discord_user_id);
