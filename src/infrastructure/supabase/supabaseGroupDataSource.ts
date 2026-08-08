import type {
  ExpenseRow,
  GroupDataSource,
  GroupRow,
  MemberRow,
  SettlementRow,
} from "@/application/groups/loadGroupSnapshot"
import { supabase } from "@/lib/supabase"

export class SupabaseGroupDataSource implements GroupDataSource {
  async findGroupByInviteToken(inviteToken: string): Promise<GroupRow | null> {
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, currency, invite_token")
      .eq("invite_token", inviteToken)
      .maybeSingle()

    if (error) throw new Error(`Failed to load group: ${error.message}`)
    return data as GroupRow | null
  }

  async findMembership(
    groupId: string,
    userId: string,
  ): Promise<MemberRow | null> {
    const { data, error } = await supabase
      .from("group_members")
      .select("id, group_id, guest_name, user_id, swish_phone")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load membership: ${error.message}`)
    }
    return data as MemberRow | null
  }

  async listMembers(groupId: string): Promise<MemberRow[]> {
    const { data, error } = await supabase
      .from("group_members")
      .select("id, group_id, guest_name, user_id, swish_phone")
      .eq("group_id", groupId)

    if (error) throw new Error(`Failed to load members: ${error.message}`)
    return (data ?? []) as MemberRow[]
  }

  async listExpenses(groupId: string): Promise<ExpenseRow[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select(
        "id, group_id, paid_by, amount, description, split_among, split_overrides, created_at",
      )
      .eq("group_id", groupId)

    if (error) throw new Error(`Failed to load expenses: ${error.message}`)
    return (data ?? []) as ExpenseRow[]
  }

  async listSettlements(groupId: string): Promise<SettlementRow[]> {
    const { data, error } = await supabase
      .from("settlements")
      .select("id, group_id, from_member, to_member, amount")
      .eq("group_id", groupId)

    if (error) {
      throw new Error(`Failed to load settlements: ${error.message}`)
    }
    return (data ?? []) as SettlementRow[]
  }
}
