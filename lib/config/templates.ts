
export interface Template {
  id: string
  name: string
  content: string
  type: 'email' | 'report'
}

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'welcome-email',
    name: 'Bienvenida Cliente',
    content: 'Hola {{name}}, bienvenido a nuestros servicios contables.',
    type: 'email'
  },
  {
    id: 'monthly-report',
    name: 'Reporte Mensual',
    content: 'Estimado {{name}}, adjunto encontrará su reporte mensual.',
    type: 'report'
  }
]
