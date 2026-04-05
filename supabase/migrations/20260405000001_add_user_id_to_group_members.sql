alter table group_members
  add column user_id uuid not null references auth.users(id);

alter table group_members
  add constraint group_members_group_user_unique unique (group_id, user_id);

alter table groups
  add column created_by uuid not null references auth.users(id);
