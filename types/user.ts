
export type UserRole = 'admin' | 'accountant' | 'freelancer'

export interface UserProfile {
  id: string
  email: string
  fullName?: string
  role: UserRole
  subscriptionPlan?: string
  countryCode?: string
  createdAt: string
}
