create table settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_member uuid not null references group_members(id),
  to_member uuid not null references group_members(id),
  amount numeric(12, 2) not null check (amount > 0),
  settled_at timestamptz not null default now()
);
