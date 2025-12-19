import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { getElection, listElections, registerCandidate } from "@/lib/apiEndpoints"
import type { Election } from "@/types/election"

export default function CandidateRegisterPage() {
  const navigate = useNavigate()

  const [elections, setElections] = useState<Election[]>([])
  const [loadingElections, setLoadingElections] = useState(true)

  const [selectedElectionId, setSelectedElectionId] = useState<string>("")
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)

  const [form, setForm] = useState({
    fullName: "",
    enrollmentId: "",
    scholarOrRollNumber: "",
    department: "",
    semesterOrYear: "",
    mobile: "",
    email: "",
    password: "",
    positionId: "",
    photoUrl: "",
    electionSymbolUrl: "",
    manifesto: ""
  })

  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  useEffect(() => {
    ;(async () => {
      setLoadingElections(true)
      try {
        const data = await listElections()
        setElections(data)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load elections")
      } finally {
        setLoadingElections(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!selectedElectionId) {
        setSelectedElection(null)
        set("positionId", "")
        return
      }

      try {
        const e = await getElection(selectedElectionId)
        setSelectedElection(e)
        set("positionId", "")
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load election")
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElectionId])

  const positions = useMemo(() => {
    return (selectedElection?.positions || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [selectedElection])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedElectionId) {
      toast.error("Please select an election")
      return
    }

    if (!form.positionId) {
      toast.error("Please select a position")
      return
    }

    setSubmitting(true)

    try {
      await registerCandidate({
        fullName: form.fullName,
        enrollmentId: form.enrollmentId,
        scholarOrRollNumber: form.scholarOrRollNumber,
        department: form.department,
        semesterOrYear: form.semesterOrYear,
        mobile: form.mobile,
        email: form.email,
        password: form.password,
        electionId: selectedElectionId,
        positionId: form.positionId,
        photoUrl: form.photoUrl || undefined,
        electionSymbolUrl: form.electionSymbolUrl || undefined,
        manifesto: form.manifesto || undefined
      })

      toast.success("Candidate registered! OTP sent to email and mobile.")

      navigate("/candidate/verify-otp", {
        replace: true,
        state: { email: form.email, mobile: form.mobile }
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Candidate Registration</h1>
              <p className="text-sm text-muted-foreground">Apply even in DRAFT (approval required)</p>
            </div>
            <ModeToggle />
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Election</Label>
                    <Select value={selectedElectionId} onValueChange={setSelectedElectionId} disabled={loadingElections}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingElections ? "Loading elections…" : "Select election"} />
                      </SelectTrigger>
                      <SelectContent>
                        {elections.map((e) => (
                          <SelectItem key={e._id} value={e._id}>
                            {e.name} ({e.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Position Applying For</Label>
                    <Select value={form.positionId} onValueChange={(v) => set("positionId", v)} disabled={!selectedElection}>
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedElection ? "Select election first" : "Select position"} />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                    <Label>Mobile (E.164)</Label>
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

                  <div className="space-y-2">
                    <Label>Photo URL (optional)</Label>
                    <Input value={form.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="/uploads/..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Election Symbol URL (optional)</Label>
                    <Input value={form.electionSymbolUrl} onChange={(e) => set("electionSymbolUrl", e.target.value)} placeholder="/uploads/..." />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Manifesto / About (optional)</Label>
                    <Textarea value={form.manifesto} onChange={(e) => set("manifesto", e.target.value)} placeholder="Your vision…" />
                  </div>

                  <div className="md:col-span-2 mt-2 flex flex-col gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting…" : "Register Candidate & Send OTP"}
                    </Button>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Link to="/candidate/login" className="hover:underline">
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
