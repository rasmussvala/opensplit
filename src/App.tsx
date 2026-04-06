import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import AdminPage from "@/components/admin/AdminPage"
import AdminRoute from "@/components/auth/AdminRoute"
import { AuthProvider } from "@/components/auth/AuthProvider"
import GroupPage from "@/components/group/GroupPage"

export default function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/" element={<AdminPage />} />
          </Route>
          <Route path="/groups/:inviteToken" element={<GroupPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
