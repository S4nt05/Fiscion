
export type InvoiceStatus = 'pending' | 'processed' | 'reviewed' | 'rejected'

export interface Invoice {
  id: string
  userId: string
  fileUrl: string
  fileName: string
  status: InvoiceStatus
  totalAmount?: number
  taxAmount?: number
  currency?: string
  vendorName?: string
  date?: string
  category?: string
  rawText?: string
  createdAt: string
  updatedAt: string
}
