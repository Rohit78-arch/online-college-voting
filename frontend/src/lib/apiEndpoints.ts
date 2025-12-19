import { api } from "@/lib/api"
import type { ApprovedCandidateItem } from "@/types/candidate"
import type { CandidateProfile } from "@/types/candidateProfile"
import type { Election } from "@/types/election"
import type { ElectionResults } from "@/types/results"

export async function listElections() {
  const res = await api.get<{ success: boolean; data: Election[] }>("/elections")
  return res.data.data
}

export async function getElection(electionId: string) {
  const res = await api.get<{ success: boolean; data: Election }>(`/elections/${electionId}`)
  return res.data.data
}

export async function registerVoter(payload: {
  fullName: string
  enrollmentId: string
  scholarOrRollNumber: string
  department: string
  semesterOrYear: string
  mobile: string
  email: string
  password: string
}) {
  const res = await api.post("/auth/register/voter", payload)
  return res.data
}

export async function registerCandidate(payload: {
  fullName: string
  enrollmentId: string
  scholarOrRollNumber: string
  department: string
  semesterOrYear: string
  mobile: string
  email: string
  password: string
  electionId: string
  positionId: string
  photoUrl?: string
  electionSymbolUrl?: string
  manifesto?: string
}) {
  const res = await api.post("/auth/register/candidate", payload)
  return res.data
}

export async function sendEmailOtp(email: string) {
  const res = await api.post("/auth/otp/email/send", { email })
  return res.data
}

export async function verifyEmailOtp(email: string, otp: string) {
  const res = await api.post("/auth/otp/email/verify", { email, otp })
  return res.data
}

export async function sendMobileOtp(mobile: string) {
  const res = await api.post("/auth/otp/mobile/send", { mobile })
  return res.data
}

export async function verifyMobileOtp(mobile: string, otp: string) {
  const res = await api.post("/auth/otp/mobile/verify", { mobile, otp })
  return res.data
}

export async function listApprovedCandidates(electionId: string, positionId?: string) {
  const url = positionId
    ? `/elections/${electionId}/candidates?positionId=${encodeURIComponent(positionId)}`
    : `/elections/${electionId}/candidates`
  const res = await api.get<{ success: boolean; data: ApprovedCandidateItem[] }>(url)
  return res.data.data
}

export async function getMyVoteStatus(electionId: string) {
  const res = await api.get<{ success: boolean; data: { hasVoted: boolean; votedAt: string | null } }>(
    `/votes/${electionId}/my-status`
  )
  return res.data.data
}

export async function castVote(electionId: string, selections: { positionId: string; candidateUserId: string }[]) {
  const res = await api.post(`/votes/${electionId}/cast`, { selections })
  return res.data
}

// Candidate
export async function getMyCandidateProfile(electionId: string) {
  const res = await api.get<{ success: boolean; data: CandidateProfile }>(`/candidate/elections/${electionId}/profile`)
  return res.data.data
}

export async function updateMyCandidateProfile(
  electionId: string,
  payload: { manifesto?: string; photoUrl?: string; electionSymbolUrl?: string; positionId?: string }
) {
  const res = await api.patch<{ success: boolean; data: CandidateProfile }>(`/candidate/elections/${electionId}/profile`, payload)
  return res.data.data
}

// --- Admin ---

// Verification
export async function listPendingVoters() {
  const res = await api.get("/admin/approvals/voters?status=PENDING")
  return res.data.data
}

export async function listPendingCandidates() {
  const res = await api.get("/admin/approvals/candidates?status=PENDING")
  return res.data.data
}

export async function setUserApproval(userId: string, status: "APPROVED" | "REJECTED") {
  const res = await api.patch(`/admin/approvals/users/${userId}`, { status })
  return res.data
}

// Election Management
export async function listAllElectionsAdmin() {
  const res = await api.get("/admin/elections")
  return res.data.data
}

export async function createElection(payload: any) {
  const res = await api.post("/admin/elections", payload)
  return res.data.data
}

export async function startElection(electionId: string) {
  const res = await api.post(`/admin/elections/${electionId}/start`)
  return res.data
}

export async function stopElection(electionId: string) {
  const res = await api.post(`/admin/elections/${electionId}/stop`)
  return res.data
}

export async function addPosition(electionId: string, payload: { title: string; description?: string; seats?: number }) {
  const res = await api.post(`/admin/elections/${electionId}/positions`, payload)
  return res.data.data
}

export async function publishResults(electionId: string) {
  const res = await api.post(`/admin/elections/${electionId}/publish-results`)
  return res.data
}

export async function getAdminResults(electionId: string) {
  const res = await api.get(`/admin/elections/${electionId}/results`)
  return res.data.data
}

export async function getAdminAnalytics(electionId: string) {
  const res = await api.get(`/admin/elections/${electionId}/analytics`)
  return res.data.data
}

export async function exportResultsPdf(electionId: string) {
  const res = await api.get(`/admin/elections/${electionId}/export/pdf`, { responseType: 'blob' })
  return res.data
}

export async function exportResultsExcel(electionId: string) {
  const res = await api.get(`/admin/elections/${electionId}/export/excel`, { responseType: 'blob' })
  return res.data
}

export async function getCandidateResults(electionId: string) {
  const res = await api.get<{ success: boolean; data: ElectionResults }>(`/candidate/elections/${electionId}/results`)
  return res.data.data
}
