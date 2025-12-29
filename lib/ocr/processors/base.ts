
export interface OCRResult {
  raw_text: string
  total_amount?: number
  tax_amount?: number
  date?: string
  vendor_name?: string
  currency?: string
  items?: any[]
}

export abstract class BaseProcessor {
  abstract extract(text: string, config?: any): OCRResult
  
  protected parseAmount(text: string): number | undefined {
    // Implementación básica de limpieza de montos
    const clean = text.replace(/[^0-9.]/g, '')
    const val = parseFloat(clean)
    return isNaN(val) ? undefined : val
  }
}
