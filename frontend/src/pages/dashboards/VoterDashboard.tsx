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
  const [loading, setLoading] = useState<boolean>(true)
  const [showAll, setShowAll] = useState<boolean>(false)
  const [elections, setElections] = useState<Election[]>([])
  const [voteStatusByElectionId, setVoteStatusByElectionId] =
    useState<Record<string, boolean>>({})

  // Fetch elections
  useEffect(() => {
    let cancelled = false

    const fetchElections = async () => {
      setLoading(true)
      try {
        const data = await listElections()
        if (!cancelled) setElections(data)
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to load elections"
        toast.error(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchElections()

    return () => {
      cancelled = true
    }
  }, [])

  const running = useMemo(
    () => elections.filter((e) => e.status === "RUNNING"),
    [elections]
  )

  const visible = useMemo(
    () => (showAll ? elections : running),
    [showAll, elections, running]
  )

  // Fetch vote status
  useEffect(() => {
    if (loading || visible.length === 0) return

    let cancelled = false

    const fetchVoteStatus = async () => {
      try {
        const results = await Promise.all(
          visible.map(async (e) => {
            try {
              const res = await getMyVoteStatus(e._id)
              return [e._id, res.hasVoted] as const
            } catch {
              return [e._id, false] as const
            }
          })
        )

        if (cancelled) return

        setVoteStatusByElectionId((prev) => {
          const next = { ...prev }
          results.forEach(([id, voted]) => {
            next[id] = voted
          })
          return next
        })
      } catch {
        // silent fail
      }
    }

    fetchVoteStatus()

    return () => {
      cancelled = true
    }
  }, [loading, visible])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Voter Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            RUNNING elections are shown by default.
          </p>
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
            <p className="text-sm text-muted-foreground">
              {showAll
                ? "No elections found."
                : "No RUNNING elections right now."}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((e) => (
                <ElectionCard
                  key={e._id}
                  election={e}
                  hasVoted={voteStatusByElectionId[e._id] ?? false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
