import { supabase } from '@/lib/database/client'

export const saveTemplate = async (template: any) => {
  const { data, error } = await supabase
    .from('accountant_templates')
    .upsert(template)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const generateReport = (templateContent: string, variables: Record<string, any>) => {
  let report = templateContent
  
  Object.entries(variables).forEach(([key, value]) => {
    // Reemplazar todas las ocurrencias de {{key}}
    const regex = new RegExp(`{{${key}}}`, 'g')
    report = report.replace(regex, String(value))
  })
  
  return report
}
