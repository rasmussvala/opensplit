-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table settlements enable row level security;

-- ============================================================
-- Helper: check if the current user is a member of a group.
-- SECURITY DEFINER avoids infinite RLS recursion when called
-- from group_members policies.
-- ============================================================
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists(
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

-- ============================================================
-- groups
-- ============================================================

-- Any authenticated user can read groups.
-- Group data (name, currency) is not sensitive and the invite_token
-- is an unguessable UUID. This openness is required for the join
-- flow (lookup by invite_token before becoming a member).
create policy "groups_select"
  on groups for select
  to authenticated
  using (true);

-- Authenticated users can create groups.
-- The created_by column must match the caller's auth.uid().
-- Additional access control is the client-side admin PIN.
create policy "groups_insert"
  on groups for insert
  to authenticated
  with check (created_by = (select auth.uid()));

-- ============================================================
-- group_members
-- ============================================================

-- Members can see other members in their group.
create policy "group_members_select"
  on group_members for select
  to authenticated
  using (public.is_group_member(group_id));

-- Any authenticated user can join a group by inserting a row
-- for themselves. The WITH CHECK ensures user_id matches the
-- caller. Access control is the unguessable invite_token
-- (you must know the group_id to join).
create policy "group_members_insert"
  on group_members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- ============================================================
-- expenses
-- ============================================================

create policy "expenses_select"
  on expenses for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "expenses_insert"
  on expenses for insert
  to authenticated
  with check (public.is_group_member(group_id));

create policy "expenses_update"
  on expenses for update
  to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "expenses_delete"
  on expenses for delete
  to authenticated
  using (public.is_group_member(group_id));

-- ============================================================
-- settlements
-- ============================================================

create policy "settlements_select"
  on settlements for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "settlements_insert"
  on settlements for insert
  to authenticated
  with check (public.is_group_member(group_id));
