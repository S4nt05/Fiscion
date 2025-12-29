
import { z } from 'zod'

export const invoiceSchema = z.object({
  file: z.any(), // En cliente es File, en servidor puede ser diferente
  userId: z.string().uuid(),
  amount: z.number().optional(),
  date: z.string().optional(),
})

export const userSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6).optional(), // Si usáramos password
})

export function validateInvoice(data: any) {
  return invoiceSchema.safeParse(data)
}
