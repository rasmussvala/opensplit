import type {
  Settlement,
  SettlementRow,
} from "@/application/groups/loadGroupSnapshot"
import type {
  SettlementCommand,
  SettlementDataSource,
} from "@/application/settlements/manageSettlements"
import { supabase } from "@/lib/supabase"

function toSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    from: row.from_member,
    to: row.to_member,
    amount: Number(row.amount),
    settledAt: row.settled_at,
  }
}

export class SupabaseSettlementDataSource implements SettlementDataSource {
  async record(command: SettlementCommand): Promise<Settlement> {
    const { data, error } = await supabase
      .from("settlements")
      .insert({
        group_id: command.groupId,
        from_member: command.from,
        to_member: command.to,
        amount: command.amount,
      })
      .select("id, group_id, from_member, to_member, amount, settled_at")
      .single()

    if (error) throw new Error(`Failed to record settlement: ${error.message}`)
    return toSettlement(data as SettlementRow)
  }

  async delete(groupId: string, settlementId: string): Promise<void> {
    const { error } = await supabase
      .from("settlements")
      .delete({ count: "exact" })
      .eq("group_id", groupId)
      .eq("id", settlementId)

    if (error) throw new Error(`Failed to delete settlement: ${error.message}`)
  }
}
