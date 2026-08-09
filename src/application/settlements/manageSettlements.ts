import type {
  GroupSnapshot,
  Settlement,
} from "@/application/groups/loadGroupSnapshot"
import { suggestedSettlements } from "@/lib/simplify"
import { round2 } from "@/lib/utils"

export type SettlementCommand = {
  groupId: string
  from: string
  to: string
  amount: number
}

export type SettlementDataSource = {
  record(command: SettlementCommand): Promise<Settlement>
  delete(groupId: string, settlementId: string): Promise<void>
}

export type RecordSettlementResult =
  | { status: "recorded"; settlement: Settlement }
  | { status: "invalid-amount" }
  | { status: "same-member" }
  | { status: "no-outstanding" }
  | { status: "exceeds-outstanding" }

export type DeleteSettlementResult = { status: "deleted" }

export function manageSettlements(dataSource: SettlementDataSource) {
  return {
    async suggest(snapshot: GroupSnapshot) {
      return suggestedSettlements(
        snapshot.expenses.map((expense) => ({
          paid_by: expense.paidBy,
          amount: expense.amount,
          split_among: expense.splitAmong,
          split_overrides: expense.splitOverrides,
        })),
        snapshot.settlements.map((settlement) => ({
          from: settlement.from,
          to: settlement.to,
          amount: settlement.amount,
        })),
      )
    },

    async record(
      input: SettlementCommand & { snapshot: GroupSnapshot },
    ): Promise<RecordSettlementResult> {
      const amount = round2(input.amount)
      if (!Number.isFinite(input.amount) || amount <= 0) {
        return { status: "invalid-amount" }
      }
      if (input.from === input.to) return { status: "same-member" }

      const suggestion = (await this.suggest(input.snapshot)).find(
        (settlement) =>
          settlement.from === input.from && settlement.to === input.to,
      )
      if (!suggestion) return { status: "no-outstanding" }
      if (amount > suggestion.amount) return { status: "exceeds-outstanding" }

      const settlement = await dataSource.record({
        groupId: input.groupId,
        from: input.from,
        to: input.to,
        amount,
      })
      return { status: "recorded", settlement }
    },

    async delete(
      groupId: string,
      settlementId: string,
    ): Promise<DeleteSettlementResult> {
      await dataSource.delete(groupId, settlementId)
      return { status: "deleted" }
    },
  }
}

export class InMemorySettlementDataSource implements SettlementDataSource {
  private settlements: { groupId: string; settlement: Settlement }[]

  constructor(settlements: Settlement[] = []) {
    this.settlements = settlements.map((settlement) => ({
      groupId: "group-1",
      settlement,
    }))
  }

  async record(command: SettlementCommand) {
    const settlement: Settlement = {
      id: `settlement-${this.settlements.length + 1}`,
      from: command.from,
      to: command.to,
      amount: command.amount,
      settledAt: "2026-01-01T00:00:00.000Z",
    }
    this.settlements.push({ groupId: command.groupId, settlement })
    return settlement
  }

  async delete(groupId: string, settlementId: string) {
    this.settlements = this.settlements.filter(
      (entry) =>
        entry.groupId !== groupId || entry.settlement.id !== settlementId,
    )
  }

  async list(groupId: string) {
    return this.settlements
      .filter((entry) => entry.groupId === groupId)
      .map((entry) => entry.settlement)
  }
}
