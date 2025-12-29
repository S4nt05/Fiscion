export const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  console.log('formatCurrency', amount, currencyCode);
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-NI')
}
