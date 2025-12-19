import { Badge } from "@/components/ui/badge"
import type { ElectionStatus } from "@/types/election"

export function ElectionStatusBadge({ status }: { status: ElectionStatus }) {
  if (status === "RUNNING") return <Badge className="bg-emerald-600 hover:bg-emerald-600">RUNNING</Badge>
  if (status === "ENDED") return <Badge variant="secondary">ENDED</Badge>
  if (status === "SCHEDULED") return <Badge variant="outline">SCHEDULED</Badge>
  return <Badge variant="outline">DRAFT</Badge>
}
