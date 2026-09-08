import {
  loadGroupSnapshot,
  manageExpenses,
  manageSettlements,
  SupabaseExpenseDataSource,
  SupabaseGroupDataSource,
  SupabaseSettlementDataSource,
} from "@rasmussvala/opensplit-core"
import { supabase } from "@/lib/supabase"

const groups = new SupabaseGroupDataSource(supabase)
const expenses = new SupabaseExpenseDataSource(supabase)
const settlements = new SupabaseSettlementDataSource(supabase)

export const application = {
  groups: loadGroupSnapshot(groups),
  expenses: manageExpenses(groups, expenses),
  settlements: manageSettlements(settlements),
}
