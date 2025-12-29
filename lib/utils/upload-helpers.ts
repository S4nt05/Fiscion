
import { supabase as defaultSupabase } from '@/lib/database/client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Abstracción para subida de archivos.
 * Actualmente usa Supabase Storage, pero está diseñado para migrar fácilmente a S3/R2.
 */
export async function uploadFile(file: File, path: string, supabaseClient?: SupabaseClient): Promise<string> {
  const supabase = supabaseClient || defaultSupabase
  // 1. Validar archivo (tamaño, tipo) - TODO: Mover a validators.ts
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File too large')
  }

  // 2. Generar nombre único
  const timestamp = Date.now()
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
  const fullPath = `${path}/${timestamp}_${cleanName}`

  // 3. Subir a Supabase Storage (Bucket 'documents')
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase Storage Error:', error)
    throw new Error('Storage upload failed')
  }

  // 4. Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fullPath)

  return publicUrl
}
