import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toAssetUrl, initials } from "@/lib/assets"
import { cn } from "@/lib/utils"

import { castVote, getElection, getMyVoteStatus, listApprovedCandidates } from "@/lib/apiEndpoints"
import { useCountdown } from "@/hooks/useCountdown"

import type { ApprovedCandidateItem } from "@/types/candidate"

type SelectionMap = Record<string, string> // positionId -> candidateUserId

type CandidatePickCardProps = {
  item: ApprovedCandidateItem
  selected: boolean
  disabled: boolean
  onSelect: () => void
}

function CandidatePickCard({ item, selected, disabled, onSelect }: CandidatePickCardProps) {
  const [photoError, setPhotoError] = useState(false)
  const [symbolError, setSymbolError] = useState(false)

  const photoSrc = !photoError ? toAssetUrl(item.profile.photoUrl) : undefined
  const symbolSrc = !symbolError ? toAssetUrl(item.profile.electionSymbolUrl) : undefined

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className={cn(
        "group text-left",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      )}
    >
      <Card
        className={cn(
          "h-full transition-colors",
          selected ? "border-emerald-500/50 bg-emerald-500/5" : "hover:bg-muted/40"
        )}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl border bg-muted">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={item.user.fullName}
                    className="h-full w-full object-cover"
                    onError={() => setPhotoError(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-semibold text-muted-foreground">
                    {initials(item.user.fullName)}
                  </div>
                )}
              </div>

              <div>
                <CardTitle className="text-sm leading-tight">{item.user.fullName}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {item.user.department ? `${item.user.department}` : ""}
                  {item.user.semesterOrYear ? ` • ${item.user.semesterOrYear}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border bg-muted">
                {symbolSrc ? (
                  <img
                    src={symbolSrc}
                    alt="Election symbol"
                    className="h-full w-full object-cover"
                    onError={() => setSymbolError(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-muted-foreground">
                    SYM
                  </div>
                )}
              </div>

              <span className={cn("rounded px-2 py-1 text-[10px]", selected ? "bg-emerald-600 text-white" : "bg-muted text-foreground")}>
                {selected ? "Selected" : "Select"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {item.profile.manifesto ? (
            <div className="space-y-2">
              <p className="line-clamp-3 text-xs text-muted-foreground">{item.profile.manifesto}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground/90 underline-offset-4 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Read full manifesto
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{item.user.fullName} — Manifesto</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
                    {item.profile.manifesto}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No manifesto provided.</p>
          )}
        </CardContent>
      </Card>
    </motion.button>
  )
}

export default function VotePage() {
  const { electionId } = useParams()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [election, setElection] = useState<Awaited<ReturnType<typeof getElection>> | null>(null)
  const [candidates, setCandidates] = useState<ApprovedCandidateItem[]>([])

  const [hasVoted, setHasVoted] = useState(false)

  const [selected, setSelected] = useState<SelectionMap>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const countdown = useCountdown(election?.endsAt)

  useEffect(() => {
    ;(async () => {
      if (!electionId) return

      setLoading(true)
      try {
        const [e, cs, status] = await Promise.all([
          getElection(electionId),
          listApprovedCandidates(electionId),
          getMyVoteStatus(electionId)
        ])
        setElection(e)
        setCandidates(cs)
        setHasVoted(status.hasVoted)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load voting data")
      } finally {
        setLoading(false)
      }
    })()
  }, [electionId])

  const positions = useMemo(() => {
    const p = election?.positions || []
    return p.slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [election])

  const candidatesByPosition = useMemo(() => {
    const map = new Map<string, ApprovedCandidateItem[]>()
    for (const item of candidates) {
      const pid = item.profile.positionId
      const arr = map.get(pid) || []
      arr.push(item)
      map.set(pid, arr)
    }
    return map
  }, [candidates])

  const missingPositions = useMemo(() => {
    const missing: string[] = []
    for (const p of positions) {
      if (!selected[p._id]) missing.push(p._id)
    }
    return missing
  }, [positions, selected])

  const canVote = useMemo(() => {
    if (!election) return false
    if (election.status !== "RUNNING") return false
    if (hasVoted) return false
    if (countdown.isEnded) return false
    return true
  }, [countdown.isEnded, election, hasVoted])

  async function onSubmitConfirmed() {
    if (!electionId || !election) return

    if (!canVote) {
      toast.error("Voting is not available")
      return
    }

    if (missingPositions.length) {
      toast.error("Please select candidates for all positions")
      return
    }

    setSubmitting(true)
    try {
      const selections = positions.map((p) => ({ positionId: p._id, candidateUserId: selected[p._id] }))
      await castVote(electionId, selections)

      setHasVoted(true)
      setConfirmOpen(false)
      toast.success("Vote cast successfully!")

      // Confetti burst
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } })
    } catch (err) {
      toast.error((err as any)?.response?.data?.message || "Failed to cast vote")
    } finally {
      setSubmitting(false)
    }
  }

  function openConfirm() {
    if (!canVote) {
      toast.error("Voting is not available")
      return
    }

    if (missingPositions.length) {
      toast.error("Please select candidates for all positions")
      return
    }

    setConfirmOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    )
  }

  if (!election) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Election not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/voter/dashboard">Back</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{election.name}</h1>
          <p className="text-sm text-muted-foreground">Single ballot: vote for all positions and submit once.</p>
        </div>

        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Time remaining</p>
          <p className="font-mono text-sm">{election.status === "RUNNING" ? countdown.text : "--:--:--"}</p>
        </div>
      </div>

      {hasVoted ? (
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-base">You have already voted</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your ballot is locked for this election.
          </CardContent>
        </Card>
      ) : null}

      {election.status !== "RUNNING" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voting is not active</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Election status: {election.status}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {positions.map((pos) => {
            const list = candidatesByPosition.get(pos._id) || []
            const pickedCandidateUserId = selected[pos._id]

            return (
              <div key={pos._id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pos.title}</p>
                    <p className="text-xs text-muted-foreground">Choose 1 candidate</p>
                  </div>
                  <span className={pickedCandidateUserId ? "text-xs text-emerald-600" : "text-xs text-muted-foreground"}>
                    {pickedCandidateUserId ? "Selected" : "Not selected"}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {list.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No approved candidates for this position.</div>
                  ) : (
                    list.map((item) => {
                      const isSelected = pickedCandidateUserId === item.candidateUserId

                      return (
                        <CandidatePickCard
                          key={item.candidateUserId}
                          item={item}
                          selected={isSelected}
                          disabled={!canVote}
                          onSelect={() =>
                            setSelected((prev) => ({
                              ...prev,
                              [pos._id]: item.candidateUserId
                            }))
                          }
                        />
                      )
                    })
                  )}
                </div>

                <Separator />
              </div>
            )
          })}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">Missing selections: {missingPositions.length}</p>
            <Button onClick={openConfirm} disabled={!canVote || submitting}>
              {submitting ? "Submitting…" : "Submit Final Vote"}
            </Button>
          </div>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Confirm your final vote</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  This is your <span className="font-medium text-foreground">final ballot</span>. After submitting, you
                  cannot change your vote.
                </p>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-foreground">Your selections</p>
                  <div className="mt-2 space-y-2">
                    {positions.map((p) => {
                      const candidateId = selected[p._id]
                      const item = candidates.find((x) => x.candidateUserId === candidateId)

                      const photoSrc = item?.profile?.photoUrl ? toAssetUrl(item.profile.photoUrl) : undefined
                      const symbolSrc = item?.profile?.electionSymbolUrl ? toAssetUrl(item.profile.electionSymbolUrl) : undefined

                      return (
                        <div key={p._id} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">{p.title}</span>

                          {item ? (
                            <div className="flex items-center gap-2">
                              <div className="relative h-7 w-7 overflow-hidden rounded-lg border bg-muted">
                                {photoSrc ? (
                                  <img
                                    src={photoSrc}
                                    alt={item.user.fullName}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-muted-foreground">
                                    {initials(item.user.fullName)}
                                  </div>
                                )}
                              </div>

                              <div className="relative h-6 w-6 overflow-hidden rounded-full border bg-muted">
                                {symbolSrc ? (
                                  <img
                                    src={symbolSrc}
                                    alt="Symbol"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-[9px] font-semibold text-muted-foreground">
                                    SYM
                                  </div>
                                )}
                              </div>

                              <span className="text-xs font-medium">{item.user.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium">—</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                  <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={onSubmitConfirmed} disabled={submitting}>
                    {submitting ? "Submitting…" : "Confirm & Submit"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to="/voter/dashboard">Back to dashboard</Link>
      </Button>
    </motion.div>
  )
}
