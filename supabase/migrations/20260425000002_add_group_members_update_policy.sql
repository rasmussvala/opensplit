-- Allow members to update their own row (e.g. swish_phone, guest_name).
create policy "group_members_update_self"
  on group_members for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
