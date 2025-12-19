import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/types/auth"

const roleMeta: Record<Role, { title: string; toDashboard: string; hint: string }> = {
  VOTER: {
    title: "Voter Login",
    toDashboard: "/voter/dashboard",
    hint: "Use Enrollment ID or Email"
  },
  CANDIDATE: {
    title: "Candidate Login",
    toDashboard: "/candidate/dashboard",
    hint: "Use Enrollment ID or Email"
  },
  ADMIN: {
    title: "Admin Login",
    toDashboard: "/admin/dashboard",
    hint: "Use Email or Admin ID"
  }
}

export default function RoleLoginPage({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { login } = useAuth()

  const meta = useMemo(() => roleMeta[role], [role])

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(identifier, password, { expectedRole: role })
      navigate(meta.toDashboard, { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <motion.div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
              <p className="text-sm text-muted-foreground">{meta.hint}</p>
            </div>
            <ModeToggle />
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card className="backdrop-blur">
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Identifier</Label>
                    <Input
                      id="identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === "ADMIN" ? "admin@college.edu or ADM001" : "ENR001 or student@college.edu"}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Link to="/" className="hover:underline">
                      Back to role selection
                    </Link>
                    <span>OTP verified + approved required</span>
                  </div>

                  {role !== "ADMIN" ? (
                    <div className="text-xs text-muted-foreground">
                      New here?{" "}
                      <Link
                        to={role === "VOTER" ? "/voter/register" : "/candidate/register"}
                        className="font-medium text-foreground hover:underline"
                      >
                        Create an account
                      </Link>
                    </div>
                  ) : null}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
