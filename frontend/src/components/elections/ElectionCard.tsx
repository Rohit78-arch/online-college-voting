import { Link } from "react-router-dom"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge"
import { useCountdown } from "@/hooks/useCountdown"
import type { Election } from "@/types/election"

export function ElectionCard({ election, hasVoted }: { election: Election; hasVoted?: boolean }) {
  const countdown = useCountdown(election.endsAt)

  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 450, damping: 28 }}>
      <Card className="h-full">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base leading-snug">{election.name}</CardTitle>
            <div className="flex items-center gap-2">
              {hasVoted ? <Badge className="bg-emerald-600 hover:bg-emerald-600">VOTED</Badge> : null}
              <ElectionStatusBadge status={election.status} />
            </div>
          </div>
          {election.description ? <p className="text-xs text-muted-foreground">{election.description}</p> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {election.status === "RUNNING" ? (
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Time remaining</p>
              <p className="font-mono text-sm">{countdown.text}</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/20 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Not active</p>
              <p className="text-sm">Voting opens when admin starts election</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Positions: {election.positions?.length || 0}</p>

            <Button asChild disabled={election.status !== "RUNNING" || Boolean(hasVoted)}>
              <Link to={`/voter/elections/${election._id}/vote`}>{hasVoted ? "Voted" : "Vote"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
