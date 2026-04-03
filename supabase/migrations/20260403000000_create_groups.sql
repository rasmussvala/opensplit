create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'SEK',
  invite_token text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);
