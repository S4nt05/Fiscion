import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/database/server'
import { GoogleDocAIProcessor } from '@/lib/ocr/google-doc-ai'
import { NicaraguaInvoiceProcessor } from '@/lib/ocr/processors/nicaragua'

// Helper para auto-categorización
async function autoCategorizeInvoice(fields: any, categories: string[]) {
  // Lógica simple por ahora, podría usar IA
  return categories[0] || 'Otros'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { fileUrl, userId, countryCode } = await request.json()
    
    // 1. Obtener configuración del país
    const { data: countryConfig } = await supabase
      .from('countries')
      .select('*')
      .eq('code', countryCode)
      .single()
    
    if (!countryConfig) {
      return NextResponse.json({ error: 'Configuración de país no encontrada' }, { status: 400 })
    }
    
    // 2. Procesar con Estrategia Híbrida (Fallback)
    let processedFields: any = {}
    let rawText = ''
    
    // A. Intentar con Document AI Invoice Processor (Prioridad Alta)
    const invoiceProcessorId = process.env.GOOGLE_INVOICE_PROCESSOR_ID
    console.log("🔍 [OCR Debug] Processor ID configured:", invoiceProcessorId ? "YES" : "NO")

    if (invoiceProcessorId) {
        try {
            console.log("🚀 [OCR Debug] Calling Google Invoice Processor...")
            const { text, entities } = await GoogleDocAIProcessor.processInvoice(fileUrl, invoiceProcessorId)
            rawText = text
            console.log("✅ [OCR Debug] Google Entities:", JSON.stringify(entities, null, 2))

            processedFields = {
                total_amount: entities.total_amount,
                invoice_date: entities.invoice_date,
                tax_amount: entities.tax_amount,
                vendor_name: entities.supplier_name,
                vendor_tax_id: entities.supplier_tax_id, // RUC según Google
                currency: entities.currency
            }
        } catch (e) {
            console.error("⚠️ [OCR Debug] Invoice Processor Failed:", e)
        }
    } else {
        console.log("ℹ️ [OCR Debug] No Invoice Processor ID found, skipping Google Invoice AI.")
    }

    // B. Fallback: Si no hay Invoice Processor o faltan datos críticos, usar Regex tradicional
    // (Si Document AI falló totalmente, intentamos sacar texto plano con el procesador genérico si quisiéramos, 
    // pero aquí asumimos que ya tenemos rawText o que processDocument de fallback se llamaría)
    
    // Si no tenemos rawText (Doc AI falló al inicio), intentamos método legacy
    if (!rawText) {
         try {
             rawText = await GoogleDocAIProcessor.processDocument(fileUrl)
         } catch(e) {
             console.error("❌ Falló también el OCR genérico", e)
         }
    }

    // Ejecutar Regex Específico (Nicaragua/Local)
    // Esto es útil porque el Regex de Nicaragua es muy bueno para el RUC específico que Google a veces no cacha como 'supplier_tax_id'
    let regexFields: any = {}
    switch (countryCode) {
      case 'NI':
        regexFields = NicaraguaInvoiceProcessor.extractFields(rawText, countryConfig)
        break
      default:
        regexFields = { raw_text: rawText }
    }

    // C. MERGE INTELIGENTE
    // Priorizamos Document AI campos numéricos/complejos, pero mantenemos Regex si DocAI falló
    processedFields = {
        ...processedFields, // Base: lo que trajo Google
        // Si Google no trajo fecha, usar la del Regex
        invoice_date: processedFields.invoice_date || regexFields.invoice_date,
        // El total de Google suele ser más preciso (lee totales finales), el regex a veces agarra subtotales. Prioridad Google.
        total_amount: processedFields.total_amount || regexFields.total_amount,
        // El RUC local suele ser mejor detectado por el Regex específico del país
        vendor_tax_id: processedFields.vendor_tax_id || regexFields.vendor_tax_id,
        // Impuesto
        tax_amount: processedFields.tax_amount || regexFields.tax_amount,
        // Deducibilidad es lógica de negocio (Regex/Code), Google no lo sabe
        is_deductible: regexFields.is_deductible === true ? 'deducible' : (regexFields.is_deductible === false ? 'no_deducible' : 'pendiente'),
        vendor_name: processedFields.vendor_name || regexFields.vendor_name
    }
    
    // Si aún no tenemos datos clave, marcamos para revisión manual
    if (!processedFields.total_amount) {
        processedFields.needs_review = true
    }
    
    // 4. Aplicar reglas fiscales del país
    const config = countryConfig.config as any
    const vatRate = config?.vat_rate || 0
    if (!processedFields.tax_amount && processedFields.total_amount && vatRate > 0) {
      processedFields.tax_amount = processedFields.total_amount * (vatRate / 100)
      processedFields.subtotal_amount = processedFields.total_amount - processedFields.tax_amount
    }
    
    // 5. Categorizar automáticamente
    const categories = config?.categories || []
    processedFields.category = await autoCategorizeInvoice(processedFields, categories)
    
    // 6. Guardar en base de datos
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        file_name: 'uploaded_file', // Debería venir del request
        file_url: fileUrl,
        raw_text: rawText,
        ocr_data: processedFields,
        // country_code no está en la tabla invoices según schema, pero podría ser útil
        ...processedFields
      })
      .select()
      .single()
    
    if (error) throw error
    
    // 7. Actualizar contador de facturas del usuario
    await supabase.rpc('increment_user_invoice_count', { user_id: userId })
    
    return NextResponse.json({ 
      success: true, 
      invoice,
      country_applied: countryCode,
      rules_applied: {
        vat_rate: vatRate,
        categories: categories
      }
    })
    
  } catch (error) {
    console.error('OCR Processing Error:', error)
    return NextResponse.json({ error: 'Error procesando factura' }, { status: 500 })
  }
}
