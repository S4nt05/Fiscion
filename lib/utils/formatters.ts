// export const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
//   console.log('formatCurrency', amount, currencyCode);
//   return new Intl.NumberFormat('es-NI', {
//     style: 'currency',
//     currency: currencyCode,
//   }).format(amount)
// }

// export const formatDate = (dateString: string) => {
//   if (!dateString) return ''
//   return new Date(dateString).toLocaleDateString('es-NI')
// }
export const formatCurrency = (amount: number, currencyCode: string = 'NIO') => {
  // 1. Sanitización: Si el código es '$', nulo o inválido, forzamos 'NIO' o 'USD'
  // Esto evita el error "Invalid currency code : $"
  let cleanCode = currencyCode;
  
  if (!currencyCode || currencyCode === '$' || currencyCode.length !== 3) {
    cleanCode = 'NIO'; 
  }

  try {
    // 2. Intentamos formatear con el código limpio
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: cleanCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // 3. Fallback: Si algo falla (moneda exótica no soportada), 
    // devolvemos un formato básico para no romper la UI
    console.error('Error formateando moneda:', error);
    return `${cleanCode} ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  }
}

export const formatDate = (dateString: string) => {
  if (!dateString) return '---'
  
  try {
    const date = new Date(dateString);
    // Verificamos si la fecha es válida
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    
    return date.toLocaleDateString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return '---';
  }
}