-- Nest — Grocery lists addition
-- Run this once in the Supabase SQL editor after migration.sql.
-- Adds named shopping lists scoped to a household, backfills existing
-- items into a default list per household, and wires the new table into
-- the realtime publication.

create table if not exists grocery_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
create index if not exists grocery_lists_hh_idx on grocery_lists(household_id, created_at);

alter table grocery_items
  add column if not exists list_id uuid references grocery_lists(id) on delete cascade;
create index if not exists grocery_items_list_idx on grocery_items(list_id);

alter table grocery_lists enable row level security;
drop policy if exists grocery_lists_rw on grocery_lists;
create policy grocery_lists_rw on grocery_lists for all
  using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

do $$
declare t text;
begin
  foreach t in array array['grocery_lists'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Backfill: every household gets a default list, and every existing
-- grocery item without a list is attached to its household's default.
do $$
declare h record; dl uuid;
begin
  for h in select id, created_by from households loop
    select id into dl from grocery_lists where household_id = h.id order by created_at asc limit 1;
    if dl is null then
      insert into grocery_lists (household_id, name, created_by)
        values (h.id, 'הקניות שלנו', h.created_by)
        returning id into dl;
    end if;
    update grocery_items set list_id = dl where household_id = h.id and list_id is null;
  end loop;
end $$;
