
export interface Accountant {
  id: string
  userId: string
  specialization?: string
  certificationNumber?: string
  maxClients: number
  currentClients: number
  isVerified: boolean
}

export interface AccountantClient {
  id: string
  accountantId: string
  clientId: string
  status: 'active' | 'pending' | 'inactive'
  assignedAt: string
}
