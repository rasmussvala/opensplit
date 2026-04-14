-- ============================================================
-- settlements: allow members to delete settlements in their group
-- ============================================================

create policy "settlements_delete"
  on settlements for delete
  to authenticated
  using (public.is_group_member(group_id));
