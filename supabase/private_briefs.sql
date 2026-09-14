create table if not exists public.private_briefs (
  id uuid primary key,
  submitted_at timestamptz not null default now(),
  name text not null,
  organisation text not null,
  country text not null,
  contact_email text not null,
  payload jsonb not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'declined', 'accepted', 'archived'))
);

alter table public.private_briefs enable row level security;

-- Deliberately no anon/authenticated policies. The browser never receives a database key.
-- The server-side Vercel function inserts using the protected service-role credential.
create index if not exists private_briefs_submitted_at_idx on public.private_briefs (submitted_at desc);
create index if not exists private_briefs_status_idx on public.private_briefs (status);
