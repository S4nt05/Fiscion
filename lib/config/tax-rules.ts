
export const TAX_RULES = {
  NI: {
    vat_rate: 15,
    currency: 'NIO',
    categories: [
      'Alimentación',
      'Transporte',
      'Servicios Básicos',
      'Suministros de Oficina',
      'Mantenimiento',
      'Otros'
    ]
  },
  CR: {
    vat_rate: 13,
    currency: 'CRC',
    categories: [
      'Alimentación',
      'Transporte',
      'Servicios Públicos',
      'Materiales',
      'Otros'
    ]
  },
  // Default fallback
  DEFAULT: {
    vat_rate: 0,
    currency: 'USD',
    categories: ['General']
  }
}

export function getTaxRules(countryCode: string) {
  return TAX_RULES[countryCode as keyof typeof TAX_RULES] || TAX_RULES.DEFAULT
}
