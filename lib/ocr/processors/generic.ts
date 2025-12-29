
import { BaseProcessor, OCRResult } from './base'

export class GenericProcessor extends BaseProcessor {
  extract(text: string, config?: any): OCRResult {
    // Implementación genérica muy básica
    // En un caso real, usaría Regex o NLP para buscar patrones comunes
    return {
      raw_text: text,
      // Intentar encontrar un monto total (ejemplo simple)
      total_amount: this.findTotal(text)
    }
  }

  private findTotal(text: string): number | undefined {
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.toLowerCase().includes('total')) {
        return this.parseAmount(line)
      }
    }
    return undefined
  }
}
