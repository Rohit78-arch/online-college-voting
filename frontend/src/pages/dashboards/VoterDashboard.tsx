import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ElectionCard } from "@/components/elections/ElectionCard"

import { getMyVoteStatus, listElections } from "@/lib/apiEndpoints"
import type { Election } from "@/types/election"

export default function VoterDashboard() {
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [elections, setElections] = useState<Election[]>([])
  const [voteStatusByElectionId, setVoteStatusByElectionId] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await listElections()
        setElections(data)
      } catch (err) {
        toast.error((err as any)?.response?.data?.message || "Failed to load elections")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const running = useMemo(() => elections.filter((e) => e.status === "RUNNING"), [elections])
  const visible = useMemo(() => (showAll ? elections : running), [elections, running, showAll])

  // Fetch vote-status for visible elections (so we can show "VOTED" badge)
  useEffect(() => {
    if (loading) return

    const ids = visible.map((e) => e._id)
    if (!ids.length) return

    let cancelled = false

    ;(async () => {
      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const s = await getMyVoteStatus(id)
              return [id, s.hasVoted] as const
            } catch {
              // If status cannot be fetched (edge), default to false.
              return [id, false] as const
            }
          })
        )

        if (cancelled) return

        setVoteStatusByElectionId((prev) => {
          const next = { ...prev }
          for (const [id, hasVoted] of pairs) next[id] = hasVoted
          return next
        })
      } catch {
        // no-op
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, visible])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Voter Dashboard</h1>
          <p className="text-sm text-muted-foreground">RUNNING elections are shown by default.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show RUNNING only" : "View all"}
          </Button>
          <Button asChild>
            <Link to="/">Switch role</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Elections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-[190px]" />
              <Skeleton className="h-[190px]" />
            </div>
          ) : visible.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {showAll ? "No elections found." : "No RUNNING elections right now."}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((e) => (
                <ElectionCard key={e._id} election={e} hasVoted={voteStatusByElectionId[e._id]} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
