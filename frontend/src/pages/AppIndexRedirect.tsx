import { Navigate } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"

export default function AppIndexRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (user.role === "ADMIN") return <Navigate to="/app/admin" replace />
  if (user.role === "CANDIDATE") return <Navigate to="/app/candidate" replace />
  return <Navigate to="/app/voter" replace />
}
