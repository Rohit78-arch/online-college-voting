export type ElectionStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "ENDED"

export type ElectionPosition = {
  _id: string
  title: string
  maxWinners: number
  order: number
}

export type Election = {
  _id: string
  name: string
  description?: string
  status: ElectionStatus
  startsAt?: string
  endsAt?: string
  startedAt?: string
  endedAt?: string
  autoCloseEnabled?: boolean
  resultsPublished?: boolean
  positions: ElectionPosition[]
}
