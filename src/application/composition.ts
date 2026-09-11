import {
  loadGroupSnapshot,
  manageExpenses,
  manageMembership,
  manageSettlements,
  SupabaseExpenseDataSource,
  SupabaseGroupDataSource,
  SupabaseMembershipDataSource,
  SupabaseSettlementDataSource,
} from "@rasmussvala/opensplit-core"
import { supabase } from "@/lib/supabase"

const groups = new SupabaseGroupDataSource(supabase)
const expenses = new SupabaseExpenseDataSource(supabase)
const settlements = new SupabaseSettlementDataSource(supabase)
const membership = new SupabaseMembershipDataSource(supabase)

export const application = {
  groups: loadGroupSnapshot(groups),
  expenses: manageExpenses(groups, expenses),
  membership: manageMembership(membership),
  settlements: manageSettlements(settlements),
}
