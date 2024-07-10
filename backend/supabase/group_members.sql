-- This file is autogenerated from regen-schema.ts
create table if not exists
  group_members (
    group_id text not null,
    member_id text not null,
    role text default 'member'::text not null,
    created_time timestamp with time zone default now()
  );

-- Foreign Keys
alter table group_members
add constraint public_group_members_group_id_fkey foreign key (group_id) references groups (id) on update cascade;

-- Triggers
create trigger decrement_group before delete on public.group_members for each row
execute function decrement_group_members ();

create trigger increment_group
after insert on public.group_members for each row
execute function increment_group_members ();

-- Functions
create
or replace function public.decrement_group_members () returns trigger language plpgsql as $function$ begin 
    update groups set total_members = total_members - 1 where id = old.group_id;
    return old;
end $function$;

create
or replace function public.increment_group_members () returns trigger language plpgsql as $function$ begin 
    update groups set total_members = total_members + 1 where id = new.group_id;
    return new;
end $function$;

-- Policies
alter table group_members enable row level security;

drop policy if exists "public read" on group_members;

create policy "public read" on group_members for
select
  using (true);

drop policy if exists "user can leave" on group_members;

create policy "user can leave" on group_members for delete using ((member_id = firebase_uid ()));

-- Indexes
drop index if exists group_members_pkey;

create unique index group_members_pkey on public.group_members using btree (group_id, member_id);

drop index if exists group_members_member_id_idx;

create index group_members_member_id_idx on public.group_members using btree (member_id);
