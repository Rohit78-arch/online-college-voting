export type Role = "VOTER" | "CANDIDATE" | "ADMIN"
export type AdminType = "SUPER_ADMIN" | "ELECTION_ADMIN" | "VERIFICATION_ADMIN" | undefined
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export type AuthUser = {
  id: string
  fullName: string
  role: Role
  adminType?: AdminType
  email: string
  mobile: string
  enrollmentId?: string
  approvalStatus?: ApprovalStatus
  isEmailVerified?: boolean
  isMobileVerified?: boolean
}

export type LoginResponse = {
  token: string
  user: AuthUser
}
