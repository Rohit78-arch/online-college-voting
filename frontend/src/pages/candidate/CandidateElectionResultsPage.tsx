import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { toAssetUrl, initials } from "@/lib/assets"
import { getCandidateResults } from "@/lib/apiEndpoints"
import type { ElectionResults } from "@/types/results"

export default function CandidateElectionResultsPage() {
  const { electionId } = useParams()

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ElectionResults | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!electionId) return
      setLoading(true)
      try {
        const data = await getCandidateResults(electionId)
        setResults(data)
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          toast.error(err.response?.data?.message || "Results not available")
        } else if (err instanceof Error) {
          toast.error(err.message)
        } else {
          toast.error("Results not available")
        }
        setResults(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [electionId])

  const positions = useMemo(() => results?.positions || [], [results])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results not available</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          Results are visible to candidates only after the election ends and admin publishes them.
          <div>
            <Button asChild variant="outline">
              <Link to="/candidate/dashboard">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Results: {results.election.name}</h1>
          <p className="text-sm text-muted-foreground">
            Total votes: {results.summary.totalVotesCast} • Turnout: {results.summary.turnoutPct}%
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/candidate/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Winners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {positions.map((p) => {
            const winners = p.winners || []
            return (
              <div key={p.positionId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">Total votes: {p.totalVotes}</p>
                </div>

                {winners.length ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {winners.map((w) => {
                      const photoSrc = toAssetUrl(w.profile?.photoUrl)
                      const symSrc = toAssetUrl(w.profile?.electionSymbolUrl)
                      const name = w.user?.fullName || "Unknown"
                      return (
                        <div key={w.candidateUserId} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-xl border bg-muted">
                              {photoSrc ? (
                                <img src={photoSrc} alt={name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs font-semibold text-muted-foreground">
                                  {initials(name)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {w.votes} votes • {w.percentage}%
                              </p>
                            </div>
                          </div>
                          <div className="h-8 w-8 overflow-hidden rounded-full border bg-muted">
                            {symSrc ? (
                              <img src={symSrc} alt="Symbol" className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-muted-foreground">
                                SYM
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No winners (no votes recorded).</p>
                )}

                <Separator />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
