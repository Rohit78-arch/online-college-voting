import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { useAuth } from "@/context/AuthContext"
import { toAssetUrl, initials } from "@/lib/assets"
import { getMyCandidateProfile, listElections, updateMyCandidateProfile } from "@/lib/apiEndpoints"
import type { CandidateProfile } from "@/types/candidateProfile"
import type { Election } from "@/types/election"

type CandidateElection = {
  election: Election
  profile: CandidateProfile
}

export default function CandidateDashboard() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CandidateElection[]>([])
  const [selectedElectionId, setSelectedElectionId] = useState<string>("")

  const [manifestoDraft, setManifestoDraft] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const elections = await listElections()

        // Find elections where the current candidate has a CandidateProfile.
        const pairs = await Promise.all(
          elections.map(async (e) => {
            try {
              const profile = await getMyCandidateProfile(e._id)
              return { election: e, profile } as CandidateElection
            } catch {
              return null
            }
          })
        )

        const found = pairs.filter(Boolean) as CandidateElection[]
        setItems(found)

        // Select first by default
        if (found.length) {
          setSelectedElectionId(found[0].election._id)
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          toast.error(err.response?.data?.message || "Failed to load candidate dashboard")
        } else if (err instanceof Error) {
          toast.error(err.message)
        } else {
          toast.error("Failed to load candidate dashboard")
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const selected = useMemo(() => items.find((x) => x.election._id === selectedElectionId) || null, [items, selectedElectionId])

  useEffect(() => {
    if (!selected) return
    setManifestoDraft(selected.profile.manifesto || "")
  }, [selected])

  const isElectionStarted = useMemo(() => {
    const s = selected?.election.status
    return s === "RUNNING" || s === "ENDED"
  }, [selected])

  const canEditManifesto = useMemo(() => {
    // Backend enforces this too.
    return Boolean(selected && !isElectionStarted)
  }, [isElectionStarted, selected])

  async function saveManifesto() {
    if (!selected) return

    if (!canEditManifesto) {
      toast.error("Manifesto is locked after election starts")
      return
    }

    setSaving(true)
    try {
      const updated = await updateMyCandidateProfile(selected.election._id, { manifesto: manifestoDraft })
      setItems((prev) =>
        prev.map((x) => (x.election._id === selected.election._id ? { ...x, profile: updated } : x))
      )
      toast.success("Manifesto updated")
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to update manifesto")
      } else if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("Failed to update manifesto")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candidate Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No candidate profile found for any election.</p>
          <p>
            If you recently registered, wait for admin approval. (Candidates can login only after approval.)
          </p>
          <div>
            <Button asChild variant="outline">
              <Link to="/">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const election = selected?.election
  const profile = selected?.profile

  const photoSrc = toAssetUrl(profile?.photoUrl)
  const symbolSrc = toAssetUrl(profile?.electionSymbolUrl)

  const positionTitle = election?.positions?.find((p) => p._id === profile?.positionId)?.title || "—"

  const canViewResults = Boolean(election && election.status === "ENDED" && election.resultsPublished)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Candidate Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage manifesto (until election starts) + view published results.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/">Switch role</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Your Election</CardTitle>
              <p className="text-xs text-muted-foreground">Select which election you are contesting</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user?.approvalStatus || "APPROVED"}</Badge>
              <Badge variant="outline">{election?.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label>Election</Label>
            <Select value={selectedElectionId} onValueChange={setSelectedElectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select election" />
              </SelectTrigger>
              <SelectContent>
                {items.map((x) => (
                  <SelectItem key={x.election._id} value={x.election._id}>
                    {x.election.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="text-sm font-medium">{positionTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">Position is locked after approval.</p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Results</p>
              <p className="text-sm font-medium">
                {canViewResults ? "Published" : election?.status !== "ENDED" ? "Not ended" : "Not published"}
              </p>
              <Button asChild className="mt-2 w-full" disabled={!canViewResults}>
                <Link to={`/candidate/elections/${election?._id}/results`}>View Results</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Candidate Photo</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl border bg-muted">
                  {photoSrc ? (
                    <img src={photoSrc} alt={user?.fullName || "Candidate"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-semibold text-muted-foreground">
                      {initials(user?.fullName)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Photo URL (locked after approval)</Label>
                  <Input value={profile?.photoUrl || ""} disabled />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Election Symbol</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
                  {symbolSrc ? (
                    <img src={symbolSrc} alt="Symbol" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-muted-foreground">SYM</div>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Symbol URL (locked after approval)</Label>
                  <Input value={profile?.electionSymbolUrl || ""} disabled />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manifesto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {canEditManifesto ? "You can edit your manifesto until the election starts." : "Manifesto is locked after election starts."}
          </p>

          <Textarea
            value={manifestoDraft}
            onChange={(e) => setManifestoDraft(e.target.value)}
            disabled={!canEditManifesto}
            placeholder="Write your manifesto…"
            className="min-h-[140px]"
          />

          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <Button onClick={saveManifesto} disabled={!canEditManifesto || saving}>
              {saving ? "Saving…" : "Save Manifesto"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
