-- Nest — Grocery list members
-- Run this once in the Supabase SQL editor after migration-grocery-lists.sql.
-- Adds a member_ids array to grocery_lists so a list can be tagged with
-- specific household members (a "soft" assignment — every household
-- member still has read/write access via the existing household RLS;
-- this column drives the UI labels and filtering).

alter table grocery_lists
  add column if not exists member_ids uuid[] not null default '{}';

-- Backfill: every existing list lists at least its creator.
update grocery_lists
   set member_ids = array[created_by]
 where (member_ids is null or member_ids = '{}')
   and created_by is not null;
