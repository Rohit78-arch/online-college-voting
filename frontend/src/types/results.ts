export type ResultsCandidateRow = {
  candidateUserId: string
  votes: number
  percentage: number
  user: {
    fullName: string
    enrollmentId?: string
    department?: string
    semesterOrYear?: string
  } | null
  profile: {
    photoUrl?: string
    electionSymbolUrl?: string
    manifesto?: string
  } | null
}

export type ResultsPosition = {
  positionId: string
  title: string
  maxWinners: number
  totalVotes: number
  candidates: ResultsCandidateRow[]
  winners: ResultsCandidateRow[]
}

export type ElectionResults = {
  election: {
    id: string
    name: string
    status: string
    startedAt?: string
    endedAt?: string
    endsAt?: string
    resultsPublished: boolean
  }
  summary: {
    totalEligibleVoters: number
    totalVotesCast: number
    turnoutPct: number
  }
  positions: ResultsPosition[]
}
