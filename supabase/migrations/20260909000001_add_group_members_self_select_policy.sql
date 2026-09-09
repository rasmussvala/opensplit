-- Allow members to read their own row, whatever group it is in.
--
-- group_members_select answers "may I read this row?" with is_group_member,
-- which is stable and so runs against the snapshot the statement started in.
-- A row being inserted is not in that snapshot, so `insert ... returning`
-- could not read back the row it had just written, and joining a group
-- through core failed with a policy violation. Your own row needs no
-- membership lookup to be readable.
create policy "group_members_select_self"
  on group_members for select
  to authenticated
  using (user_id = (select auth.uid()));
