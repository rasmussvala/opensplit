import type { SplitOverrides } from "@/lib/types"

export interface Group {
  id: string
  name: string
  currency: string
  inviteToken: string
}

export interface Member {
  id: string
  name: string
  userId: string
  swishPhone: string | null
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitAmong: string[]
  splitOverrides: SplitOverrides | null
}

export interface Settlement {
  id: string
  from: string
  to: string
  amount: number
}

export interface GroupSnapshot {
  group: Group
  currentMember: Member
  members: Member[]
  expenses: Expense[]
  settlements: Settlement[]
}

export type GroupDataSource = {
  findGroupByInviteToken(inviteToken: string): Promise<GroupRow | null>
  findMembership(groupId: string, userId: string): Promise<MemberRow | null>
  listMembers(groupId: string): Promise<MemberRow[]>
  listExpenses(groupId: string): Promise<ExpenseRow[]>
  listSettlements(groupId: string): Promise<SettlementRow[]>
}

export interface GroupRow {
  id: string
  name: string
  currency: string
  invite_token: string
}

export interface MemberRow {
  id: string
  group_id: string
  guest_name: string
  user_id: string
  swish_phone: string | null
}

export interface ExpenseRow {
  id: string
  group_id: string
  paid_by: string
  amount: number | string
  description: string
  split_among: string[]
  split_overrides: SplitOverrides | null
}

export interface SettlementRow {
  id: string
  group_id: string
  from_member: string
  to_member: string
  amount: number | string
}

export type LoadGroupResult =
  | { status: "not-found" }
  | { status: "join-required"; group: Group }
  | { status: "member"; snapshot: GroupSnapshot }

export interface LoadGroupSnapshotInput {
  inviteToken: string
  userId: string
}

export function loadGroupSnapshot(dataSource: GroupDataSource) {
  return {
    async execute(input: LoadGroupSnapshotInput): Promise<LoadGroupResult> {
      const groupRow = await dataSource.findGroupByInviteToken(
        input.inviteToken,
      )

      if (!groupRow) return { status: "not-found" }

      const group = toGroup(groupRow)
      const membership = await dataSource.findMembership(group.id, input.userId)

      if (!membership) return { status: "join-required", group }

      const [memberRows, expenseRows, settlementRows] = await Promise.all([
        dataSource.listMembers(group.id),
        dataSource.listExpenses(group.id),
        dataSource.listSettlements(group.id),
      ])

      return {
        status: "member",
        snapshot: {
          group,
          currentMember: toMember(membership),
          members: memberRows.map(toMember),
          expenses: expenseRows.map(toExpense),
          settlements: settlementRows.map(toSettlement),
        },
      }
    },
  }
}

export class InMemoryGroupDataSource implements GroupDataSource {
  constructor(
    private readonly data: {
      groups?: GroupRow[]
      members?: MemberRow[]
      expenses?: ExpenseRow[]
      settlements?: SettlementRow[]
    } = {},
  ) {}

  async findGroupByInviteToken(inviteToken: string) {
    return (
      this.data.groups?.find((group) => group.invite_token === inviteToken) ??
      null
    )
  }

  async findMembership(groupId: string, userId: string) {
    return (
      this.data.members?.find(
        (member) => member.group_id === groupId && member.user_id === userId,
      ) ?? null
    )
  }

  async listMembers(groupId: string) {
    return (this.data.members ?? []).filter(
      (member) => member.group_id === groupId,
    )
  }

  async listExpenses(groupId: string) {
    return (this.data.expenses ?? []).filter(
      (expense) => expense.group_id === groupId,
    )
  }

  async listSettlements(groupId: string) {
    return (this.data.settlements ?? []).filter(
      (settlement) => settlement.group_id === groupId,
    )
  }
}

function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    inviteToken: row.invite_token,
  }
}

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.guest_name,
    userId: row.user_id,
    swishPhone: row.swish_phone,
  }
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    paidBy: row.paid_by,
    splitAmong: row.split_among,
    splitOverrides: row.split_overrides,
  }
}

function toSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    from: row.from_member,
    to: row.to_member,
    amount: Number(row.amount),
  }
}
