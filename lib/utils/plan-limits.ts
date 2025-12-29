import { supabase } from '@/lib/database/client'

export async function checkUploadLimit(userId: string): Promise<boolean> {
  const { data: user, error } = await supabase
    .from('users')
    .select('invoices_this_month, invoice_limit')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  
  // Si no hay límite definido, asumimos 0 o infinito según lógica de negocio
  // Aquí asumimos que si invoice_limit es null, es ilimitado (o manejar como error)
  if (user.invoice_limit === null) return true
  
  return (user.invoices_this_month || 0) < user.invoice_limit
}
