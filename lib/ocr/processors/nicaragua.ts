export class NicaraguaInvoiceProcessor {
  static extractFields(text: string, countryConfig: any) {
    const fields: any = {}
    
    // Extraer fecha (formato DD/MM/YYYY común en Nicaragua)
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (dateMatch) {
      const [_, day, month, year] = dateMatch
      const fullYear = year.length === 2 ? `20${year}` : year
      fields.invoice_date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Buscar RUC (formato nicaragüense)
    const rucMatch = text.match(/RUC[:\s]*([J|C]\d{4}\d{5}\d{1})/i)
    if (rucMatch) {
      fields.vendor_tax_id = rucMatch[1]
    }
    
    // Buscar nombre del proveedor (ejemplo: si está antes del RUC o en las primeras líneas)
    // Esta regex es un punto de partida y puede necesitar ajuste.
    // Intenta capturar una línea de texto que podría ser un nombre de empresa
    // antes de la fecha o el RUC, o en la parte superior del documento.
    const vendorNameMatch = text.match(/^(.*?)(\n|\r\n)(?:.*(\n|\r\n)){0,3}?RUC/m); // Busca una línea antes del RUC, o en las primeras 4 líneas
    if (vendorNameMatch) {
      fields.vendor_name = vendorNameMatch[1].trim();
    } else {
      // Si no se encuentra antes del RUC, intentar buscar en las primeras líneas como un nombre de empresa común
      const generalNameMatch = text.match(/^(.*?)\n(.*?)\n(.*?)\n/);
      if (generalNameMatch && generalNameMatch[1].length > 5) { // Un nombre de empresa razonable
        fields.vendor_name = generalNameMatch[1].trim();
      }
    }
    
    // Buscar total con nombre de moneda configurado
    const currency = countryConfig.currency || 'NIO'
    const totalRegex = new RegExp(`(TOTAL|TOTAL\\s+${currency})[\\s:]*([\\d,]+\\.[\\d]{2})`, 'i')
    const totalMatch = text.match(totalRegex)
    if (totalMatch) {
      fields.total_amount = parseFloat(totalMatch[2].replace(',', ''))
    }
    
    // Buscar IVA específico para Nicaragua
    const vatName = countryConfig.config?.vat_name || 'IVA'
    const vatRegex = new RegExp(`${vatName}[\\s:]*([\\d,]+\\.[\\d]{2})`, 'i')
    const vatMatch = text.match(vatRegex)
    if (vatMatch) {
      fields.tax_amount = parseFloat(vatMatch[1].replace(',', ''))
    }
    
    // Determinar si es deducible basado en categorías configuradas
    const deductibleCategories = countryConfig.config?.categories || []
    fields.is_deductible = this.isLikelyDeductible(text, deductibleCategories)
    
    return fields
  }
  
  static isLikelyDeductible(text: string, deductibleCategories: string[]) {
    const textLower = text.toLowerCase()
    
    // Palabras clave por categoría (configurable)
    const categoryKeywords: Record<string, string[]> = {
      'Transporte': ['gasolina', 'uber', 'taxi', 'bus', 'transporte'],
      'Oficina': ['papelería', 'impresora', 'toner', 'oficina', 'escritorio'],
      'Software': ['licencia', 'software', 'suscripción', 'app', 'cloud'],
      // ... más categorías
    }
    
    for (const category of deductibleCategories) {
      const keywords = categoryKeywords[category] || []
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return true
      }
    }
    
    return false
  }
}
