export const calculateTaxSummary = (invoices: any[], countryConfig: any) => {
  const totalExpenses = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const vatRecoverable = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0)
  
  // Deducción estimada basada en porcentaje configurado
  const deductionPercentage = countryConfig.config?.deduction_percentage || 0
  const taxDeduction = totalExpenses * (deductionPercentage / 100)
  
  return {
    totalExpenses,
    vatRecoverable,
    taxDeduction
  }
}
