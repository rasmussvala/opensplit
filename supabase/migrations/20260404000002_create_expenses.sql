create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  paid_by uuid not null references group_members(id),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  split_among uuid[] not null,
  created_at timestamptz not null default now()
);
