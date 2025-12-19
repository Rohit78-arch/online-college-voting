import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/types/auth"

export function RequireAuth() {
  const { user, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return null

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RequireRole({ allowed }: { allowed: Role[] }) {
  const { user, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return null

  if (!user) return <Navigate to="/" replace state={{ from: location }} />

  if (!allowed.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
