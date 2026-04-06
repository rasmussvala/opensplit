import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import AdminRoute from "@/components/AdminRoute"
import { AuthProvider } from "@/components/AuthProvider"
import CreateGroup from "@/components/CreateGroup"
import GroupPage from "@/components/GroupPage"

export default function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/" element={<CreateGroup />} />
          </Route>
          <Route path="/groups/:inviteToken" element={<GroupPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
