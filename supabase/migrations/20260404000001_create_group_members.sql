create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  guest_name text not null,
  joined_at timestamptz not null default now()
);
