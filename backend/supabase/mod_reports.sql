-- This file is autogenerated from regen-schema.ts
create table if not exists
  mod_reports (
    report_id integer not null,
    created_time timestamp with time zone default now() not null,
    comment_id text not null,
    contract_id text not null,
    user_id text not null,
    status status_type default 'new'::status_type not null,
    mod_note text
  );

-- Indexes
drop index if exists mod_reports_pkey;

create unique index mod_reports_pkey on public.mod_reports using btree (report_id);
