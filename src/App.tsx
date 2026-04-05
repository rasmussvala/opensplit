import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import AdminRoute from "@/components/AdminRoute"
import { AuthProvider } from "@/components/AuthProvider"
import CreateGroup from "@/components/CreateGroup"

export default function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/" element={<CreateGroup />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
