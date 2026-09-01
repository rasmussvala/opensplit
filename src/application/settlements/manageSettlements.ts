import type {
  GroupSnapshot,
  Settlement,
} from "@/application/groups/loadGroupSnapshot"
import { planSettlement, validateSettlement } from "@/lib/settlementPlan"

export type SettlementCommand = {
  groupId: string
  from: string
  to: string
  amount: number
}

export type SettlementSuggestion = {
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
    async suggest(snapshot: GroupSnapshot): Promise<SettlementSuggestion[]> {
      return planSettlement(snapshot).suggestions
    },

    async record(
      input: SettlementCommand & { snapshot: GroupSnapshot },
    ): Promise<RecordSettlementResult> {
      const validation = validateSettlement(input.snapshot, input)
      if (validation.status !== "valid") return validation

      const settlement = await dataSource.record({
        groupId: input.groupId,
        from: input.from,
        to: input.to,
        amount: validation.amount,
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
