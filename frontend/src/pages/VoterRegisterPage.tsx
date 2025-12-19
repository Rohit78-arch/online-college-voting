import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerVoter } from "@/lib/apiEndpoints"

export default function VoterRegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: "",
    enrollmentId: "",
    scholarOrRollNumber: "",
    department: "",
    semesterOrYear: "",
    mobile: "", // should be E.164 for Twilio (e.g., +919876543210)
    email: "",
    password: ""
  })

  const [loading, setLoading] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await registerVoter(form)
      toast.success("Registered! OTP sent to email and mobile.")

      // Move user to OTP verification screen
      navigate("/voter/verify-otp", {
        replace: true,
        state: { email: form.email, mobile: form.mobile }
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Voter Registration</h1>
              <p className="text-sm text-muted-foreground">Create your voter account (OTP + Admin approval required)</p>
            </div>
            <ModeToggle />
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Student Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Full Name</Label>
                    <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Enrollment ID</Label>
                    <Input value={form.enrollmentId} onChange={(e) => set("enrollmentId", e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Scholar/Roll Number</Label>
                    <Input
                      value={form.scholarOrRollNumber}
                      onChange={(e) => set("scholarOrRollNumber", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={form.department} onChange={(e) => set("department", e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Semester / Year</Label>
                    <Input value={form.semesterOrYear} onChange={(e) => set("semesterOrYear", e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Mobile (E.164 for OTP)</Label>
                    <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+919876543210" required />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Password</Label>
                    <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
                  </div>

                  <div className="md:col-span-2 mt-2 flex flex-col gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Creating account…" : "Register & Send OTP"}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Link to="/voter/login" className="hover:underline">
                        Already registered? Login
                      </Link>
                      <Link to="/" className="hover:underline">
                        Back to role selection
                      </Link>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
