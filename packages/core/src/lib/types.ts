export interface DbGroup {
  id: string
  name: string
  currency: string
  invite_token: string
  created_by: string
  created_at: string
}

export interface DbGroupMember {
  id: string
  group_id: string
  guest_name: string
  user_id: string
  joined_at: string
  swish_phone?: string | null
}

export type SplitOverrideMode = "percent" | "amount"

export interface SplitOverrides {
  mode: SplitOverrideMode
  values: Record<string, number>
}

export interface DbExpense {
  id: string
  group_id: string
  paid_by: string
  amount: number
  description: string
  split_among: string[]
  split_overrides: SplitOverrides | null
  created_at: string
}

export interface DbSettlement {
  id: string
  group_id: string
  from_member: string
  to_member: string
  amount: number
  settled_at: string
}
