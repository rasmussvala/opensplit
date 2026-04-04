import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import AdminRoute from "@/components/AdminRoute"
import CreateGroup from "@/components/CreateGroup"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/" element={<CreateGroup />} />
        </Route>
      </Routes>
    </Router>
  )
}
