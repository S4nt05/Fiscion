import { supabase } from '@/lib/database/client'

export const getCountryConfig = async (countryCode: string) => {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('code', countryCode)
    .single()
  
  if (error) throw error
  return data
}

export const updateCountryConfig = async (
  countryCode: string, 
  updates: Record<string, any>
) => {
  const { data, error } = await supabase
    .from('countries')
    .update({ 
      config: updates,
      updated_at: new Date().toISOString()
    })
    .eq('code', countryCode)
    .select()
    .single()
  
  if (error) throw error
  return data
}
