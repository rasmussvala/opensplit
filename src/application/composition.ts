import { manageExpenses } from "@/application/expenses/manageExpenses"
import { loadGroupSnapshot } from "@/application/groups/loadGroupSnapshot"
import { manageSettlements } from "@/application/settlements/manageSettlements"
import { SupabaseExpenseDataSource } from "@/infrastructure/supabase/supabaseExpenseDataSource"
import { SupabaseGroupDataSource } from "@/infrastructure/supabase/supabaseGroupDataSource"
import { SupabaseSettlementDataSource } from "@/infrastructure/supabase/supabaseSettlementDataSource"

const groups = new SupabaseGroupDataSource()
const expenses = new SupabaseExpenseDataSource()
const settlements = new SupabaseSettlementDataSource()

export const application = {
  groups: loadGroupSnapshot(groups),
  expenses: manageExpenses(groups, expenses),
  settlements: manageSettlements(settlements),
}
