
import { GoogleAuth } from 'google-auth-library'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'

// Cliente real de Google Document AI
// Requiere credenciales en archivo o variables de entorno
// GOOGLE_APPLICATION_CREDENTIALS o contenido en variable

export class GoogleDocAIProcessor {
  private static client: DocumentProcessorServiceClient

  static async processInvoice(fileUrl: string, processorId?: string): Promise<{ text: string, entities: any }> {
    // Si no hay credenciales, usar mock extendido
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLIENT_EMAIL) {
        console.warn('Google Doc AI credentials missing. Using mock for development.')
        return {
            text: "MOCK INVOICE TEXT\nTotal: 33000\nFecha: 12/12/2024",
            entities: {
                total_amount: 33000,
                currency: 'NIO',
                invoice_date: '2024-12-12'
            }
        }
    }

    try {
        if (!this.client) {
            this.client = new DocumentProcessorServiceClient({
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }
            })
        }

        const fileBuffer = await fetch(fileUrl).then(res => res.arrayBuffer())
        // Usar el ID específico para facturas o fallback al genérico
        const procId = processorId || process.env.GOOGLE_PROCESSOR_ID
        const name = `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${process.env.GOOGLE_LOCATION}/processors/${procId}`

        const [result] = await this.client.processDocument({
            name,
            rawDocument: {
                content: Buffer.from(fileBuffer).toString('base64'),
                mimeType: 'application/pdf', 
            }
        })

        const text = result.document?.text || ''
        const entities: any = {}

        // Mapear entidades retornadas por el Invoice Processor
        result.document?.entities?.forEach(entity => {
            const type = entity.type
            // Normalizar valores
            let value: any = entity.mentionText

            if (entity.normalizedValue) {
                if (entity.normalizedValue.moneyValue) {
                    value = Number(entity.normalizedValue.moneyValue.units) + (entity.normalizedValue.moneyValue.nanos || 0) / 1e9
                } else if (entity.normalizedValue.dateValue) {
                    const { year, month, day } = entity.normalizedValue.dateValue
                    value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                }
            } else {
                 // Limpieza básica si no hay valor normalizado
                 if (type === 'total_amount' || type === 'net_amount' || type === 'tax_amount') {
                     value = parseFloat(value?.replace(/[^0-9.]/g, '') || '0')
                 }
            }

            // Asignar al mapa de campos
            // Document AI devuelve tipos como 'total_amount', 'invoice_date', 'supplier_name', 'supplier_tax_id'
            entities[type || 'unknown'] = value // Guardamos el valor procesado
            // También guardamos la moneda si viene en el moneyValue
            if (entity.normalizedValue?.moneyValue?.currencyCode) {
                entities['currency'] = entity.normalizedValue.moneyValue.currencyCode
            }
        })

        return { text, entities }

    } catch (error) {
        console.error('Google Doc AI Invoice Error:', error)
        throw new Error('Invoice Processing failed')
    }
  }

  static async processDocument(fileUrl: string): Promise<string> {
    // Si no hay credenciales configuradas, lanzar error o advertencia
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLIENT_EMAIL) {
      console.warn('Google Doc AI credentials missing. Using mock for development.')
      return "MOCK OCR TEXT: Total 100.00 USD"
    }

    try {
      if (!this.client) {
        this.client = new DocumentProcessorServiceClient({
          // Configuración de credenciales
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }
        })
      }

      // Lógica real de descarga y procesamiento
      // 1. Descargar archivo de fileUrl
      const fileBuffer = await fetch(fileUrl).then(res => res.arrayBuffer())
      
      // 2. Enviar a Google Doc AI
      const name = `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${process.env.GOOGLE_LOCATION}/processors/${process.env.GOOGLE_PROCESSOR_ID}`
      const [result] = await this.client.processDocument({
        name,
        rawDocument: {
          content: Buffer.from(fileBuffer).toString('base64'),
          mimeType: 'application/pdf', // Detectar dinámicamente
        }
      })

      return result.document?.text || ''
    } catch (error) {
      console.error('Google Doc AI Error:', error)
      throw new Error('OCR Processing failed')
    }
  }
}
