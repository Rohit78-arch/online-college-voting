export type CandidateUserSummary = {
  fullName: string
  enrollmentId?: string
  department?: string
  semesterOrYear?: string
}

export type CandidateProfileSummary = {
  id: string
  electionId: string
  positionId: string
  photoUrl?: string
  electionSymbolUrl?: string
  manifesto?: string
}

export type ApprovedCandidateItem = {
  candidateUserId: string
  user: CandidateUserSummary
  profile: CandidateProfileSummary
}
