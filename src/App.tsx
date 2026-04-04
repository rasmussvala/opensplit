import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import CreateGroup from "@/components/CreateGroup"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateGroup />} />
      </Routes>
    </Router>
  )
}
