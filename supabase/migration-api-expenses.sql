-- Standalone API expenses table (no auth required — accessed via service role key only)
create table if not exists api_expenses (
  id          uuid primary key default gen_random_uuid(),
  description text not null,
  amount      numeric not null,
  currency    text not null default 'ILS',
  date        date not null default current_date,
  created_at  timestamptz default now()
);

create index if not exists api_expenses_date_idx on api_expenses(date desc);

-- No RLS: this table is accessed exclusively through the service role key
-- from Vercel serverless functions. Enabling RLS would block all access
-- since there are no auth.uid()-based policies here.
alter table api_expenses disable row level security;
