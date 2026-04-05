-- Indexes on foreign key columns to improve join and RLS policy performance.

create index idx_expenses_group_id on expenses(group_id);
create index idx_expenses_paid_by on expenses(paid_by);

create index idx_group_members_user_id on group_members(user_id);

create index idx_groups_created_by on groups(created_by);

create index idx_settlements_group_id on settlements(group_id);
create index idx_settlements_from_member on settlements(from_member);
create index idx_settlements_to_member on settlements(to_member);
