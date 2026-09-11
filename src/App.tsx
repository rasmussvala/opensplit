import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import AdminPage from "@/components/admin/AdminPage"
import AdminRoute from "@/components/auth/AdminRoute"
import { AuthProvider } from "@/components/auth/AuthProvider"
import SettlePage from "@/components/balance/SettlePage"
import AddExpensePage from "@/components/expense/AddExpensePage"
import EditExpensePage from "@/components/expense/EditExpensePage"
import GroupPage from "@/components/group/GroupPage"
import HomePage from "@/components/home/HomePage"
import AppFooter from "@/components/layout/AppFooter"
import EditSettlementPage from "@/components/payments/EditSettlementPage"

export default function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="/groups/:inviteCode" element={<GroupPage />} />
            <Route
              path="/groups/:inviteCode/add-expense"
              element={<AddExpensePage />}
            />
            <Route
              path="/groups/:inviteCode/edit-expense/:expenseId"
              element={<EditExpensePage />}
            />
            <Route
              path="/groups/:inviteCode/settle/:fromMemberId/:toMemberId"
              element={<SettlePage />}
            />
            <Route
              path="/groups/:inviteCode/settlements/:settlementId"
              element={<EditSettlementPage />}
            />
          </Routes>
        </main>
        <AppFooter />
      </Router>
    </AuthProvider>
  )
}
