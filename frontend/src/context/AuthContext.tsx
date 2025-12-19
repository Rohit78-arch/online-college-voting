import * as React from "react"

import { api } from "@/lib/api"
import { clearToken, getToken, setToken } from "@/lib/storage"
import type { AuthUser, LoginResponse } from "@/types/auth"

type LoginOptions = {
  expectedRole?: AuthUser["role"]
}

type AuthState = {
  user: AuthUser | null
  isBootstrapping: boolean
  login: (identifier: string, password: string, options?: LoginOptions) => Promise<AuthUser>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = React.createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = React.useState(true)

  const refreshMe = React.useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }

    try {
      const res = await api.get<{ success: boolean; data: AuthUser }>("/auth/me")
      setUser(res.data.data)
    } catch {
      // token invalid/expired
      clearToken()
      setUser(null)
    }
  }, [])

  React.useEffect(() => {
    ;(async () => {
      setIsBootstrapping(true)
      await refreshMe()
      setIsBootstrapping(false)
    })()
  }, [refreshMe])

  const login = React.useCallback(async (identifier: string, password: string, options?: LoginOptions) => {
    const res = await api.post<{ success: boolean; data: LoginResponse }>("/auth/login", {
      identifier,
      password
    })

    const nextUser = res.data.data.user

    // Portal safety: prevent logging into the wrong portal by mistake.
    if (options?.expectedRole && nextUser.role !== options.expectedRole) {
      clearToken()
      setUser(null)
      throw new Error(`You are not allowed to login in this portal as ${nextUser.role}.`)
    }

    setToken(res.data.data.token)
    setUser(nextUser)

    return nextUser
  }, [])

  const logout = React.useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value: AuthState = {
    user,
    isBootstrapping,
    login,
    logout,
    refreshMe
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
