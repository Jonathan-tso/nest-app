-- Nest — Supabase schema, RLS, and RPCs
-- Run this once in the Supabase SQL editor against a fresh project.

create extension if not exists "pgcrypto";

-- ============ Tables ============

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null default 'sky',
  created_at timestamptz default now()
);

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table if not exists household_members (
  household_id uuid references households(id) on delete cascade,
  profile_id  uuid references profiles(id)   on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (household_id, profile_id)
);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz,
  accepted_by uuid references profiles(id),
  accepted_at timestamptz
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  amount numeric not null,
  category text not null,
  paid_by uuid references profiles(id),
  split int default 50,
  date text,
  recurring boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
create index if not exists expenses_hh_idx on expenses(household_id, created_at desc);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  amount numeric not null,
  category text not null,
  due_date text,
  recurring text,
  assignee uuid references profiles(id),
  status text default 'upcoming',
  paid boolean default false,
  created_at timestamptz default now()
);
create index if not exists bills_hh_idx on bills(household_id, created_at desc);

create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  qty text,
  section text default 'pantry',
  added_by uuid references profiles(id),
  checked boolean default false,
  created_at timestamptz default now()
);
create index if not exists grocery_hh_idx on grocery_items(household_id, created_at desc);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null,
  content jsonb not null,
  created_at timestamptz default now()
);
create index if not exists chat_profile_idx on chat_messages(profile_id, created_at asc);

create table if not exists user_settings (
  profile_id uuid primary key references profiles(id) on delete cascade,
  api_key text,
  model text default 'claude-haiku-4-5',
  budget int default 8200
);

-- ============ RLS ============

create or replace function my_household_ids() returns setof uuid
  language sql security definer stable
  as $$ select household_id from household_members where profile_id = auth.uid() $$;

alter table profiles            enable row level security;
alter table households          enable row level security;
alter table household_members   enable row level security;
alter table invitations         enable row level security;
alter table expenses            enable row level security;
alter table bills               enable row level security;
alter table grocery_items       enable row level security;
alter table chat_messages       enable row level security;
alter table user_settings       enable row level security;

drop policy if exists profiles_self            on profiles;
drop policy if exists profiles_household_read  on profiles;
create policy profiles_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_household_read on profiles for select using (
  id in (select profile_id from household_members where household_id in (select my_household_ids()))
);

drop policy if exists households_member_read   on households;
drop policy if exists households_owner_write   on households;
create policy households_member_read on households for select
  using (id in (select my_household_ids()));
create policy households_owner_write on households for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists hm_member_read on household_members;
drop policy if exists hm_self_write  on household_members;
create policy hm_member_read on household_members for select
  using (household_id in (select my_household_ids()));
create policy hm_self_write on household_members for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists expenses_rw on expenses;
create policy expenses_rw on expenses for all
  using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

drop policy if exists bills_rw on bills;
create policy bills_rw on bills for all
  using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

drop policy if exists grocery_rw on grocery_items;
create policy grocery_rw on grocery_items for all
  using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

drop policy if exists chat_self on chat_messages;
create policy chat_self on chat_messages for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists settings_self on user_settings;
create policy settings_self on user_settings for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists inv_creator on invitations;
drop policy if exists inv_read_anyone on invitations;
create policy inv_creator on invitations for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy inv_read_anyone on invitations for select using (true);

-- ============ RPCs ============

create or replace function bootstrap_account(
  display_name text,
  color text default 'sky',
  invite_code text default null
) returns uuid
  language plpgsql security definer
  as $$
declare
  uid uuid := auth.uid();
  inv record;
  hh_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  insert into profiles (id, display_name, color)
    values (uid, display_name, coalesce(color, 'sky'))
    on conflict (id) do update
      set display_name = excluded.display_name, color = excluded.color;

  insert into user_settings (profile_id) values (uid) on conflict do nothing;

  if invite_code is not null and length(invite_code) > 0 then
    select * into inv from invitations
      where code = invite_code and accepted_by is null
      limit 1;
    if inv.id is null then raise exception 'Invalid invite code'; end if;
    insert into household_members (household_id, profile_id, role)
      values (inv.household_id, uid, 'member')
      on conflict do nothing;
    update invitations set accepted_by = uid, accepted_at = now() where id = inv.id;
    return inv.household_id;
  else
    -- only create a household if user isn't already in one
    select household_id into hh_id from household_members where profile_id = uid limit 1;
    if hh_id is not null then return hh_id; end if;

    insert into households (name, created_by)
      values ('הבית של ' || display_name, uid)
      returning id into hh_id;
    insert into household_members (household_id, profile_id, role)
      values (hh_id, uid, 'owner');
    return hh_id;
  end if;
end $$;

create or replace function remove_member(target_profile uuid)
  returns void language plpgsql security definer as $$
declare hh uuid;
begin
  select household_id into hh from household_members
    where profile_id = auth.uid() and role = 'owner' limit 1;
  if hh is null then raise exception 'not an owner'; end if;
  if target_profile = auth.uid() then raise exception 'cannot remove yourself'; end if;
  delete from household_members where household_id = hh and profile_id = target_profile;
end $$;

create or replace function wipe_household()
  returns void language plpgsql security definer as $$
declare hh uuid;
begin
  select household_id into hh from household_members
    where profile_id = auth.uid() and role = 'owner' limit 1;
  if hh is null then raise exception 'not an owner'; end if;
  delete from expenses where household_id = hh;
  delete from bills where household_id = hh;
  delete from grocery_items where household_id = hh;
end $$;
