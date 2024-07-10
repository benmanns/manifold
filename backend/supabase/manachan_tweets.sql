-- This file is autogenerated from regen-schema.ts
create table if not exists
  manachan_tweets (
    id text default extensions.uuid_generate_v4 () not null,
    cost numeric,
    created_time numeric,
    tweet text,
    tweet_id text,
    user_id text,
    username text
  );

-- Policies
alter table manachan_tweets enable row level security;

drop policy if exists "Enable read access for all users" on manachan_tweets;

create policy "Enable read access for all users" on manachan_tweets for
select
  using (true);

-- Indexes
drop index if exists manachan_tweets_pkey;

create unique index manachan_tweets_pkey on public.manachan_tweets using btree (id);
