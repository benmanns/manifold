-- This file is autogenerated from regen-schema.ts
create table if not exists
  love_compatibility_answers (
    id bigint not null,
    question_id bigint not null,
    creator_id text not null,
    created_time timestamp with time zone default now() not null,
    explanation text,
    multiple_choice integer not null,
    pref_choices integer[] not null,
    importance integer not null
  );

-- Policies
alter table love_compatibility_answers enable row level security;

drop policy if exists "public read" on love_compatibility_answers;

create policy "public read" on love_compatibility_answers for
select
  using (true);

drop policy if exists "self delete" on love_compatibility_answers;

create policy "self delete" on love_compatibility_answers for delete using ((creator_id = firebase_uid ()));

drop policy if exists "self insert" on love_compatibility_answers;

create policy "self insert" on love_compatibility_answers for insert
with
  check ((creator_id = firebase_uid ()));

drop policy if exists "self update" on love_compatibility_answers;

create policy "self update" on love_compatibility_answers
for update
  using ((creator_id = firebase_uid ()));

-- Indexes
drop index if exists love_compatibility_answers_pkey;

create unique index love_compatibility_answers_pkey on public.love_compatibility_answers using btree (id);

drop index if exists love_compatibility_answers_question_creator_unique;

create unique index love_compatibility_answers_question_creator_unique on public.love_compatibility_answers using btree (question_id, creator_id);

drop index if exists love_compatibility_answers_creator_id_created_time_idx;

create index love_compatibility_answers_creator_id_created_time_idx on public.love_compatibility_answers using btree (creator_id, created_time desc);

drop index if exists love_compatibility_answers_question_id_idx;

create index love_compatibility_answers_question_id_idx on public.love_compatibility_answers using btree (question_id);
