alter table group_members
  add column member_token uuid not null default gen_random_uuid() unique;
