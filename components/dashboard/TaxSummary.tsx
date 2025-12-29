'use client'

import { useState, useEffect } from 'react'
import { getCountryConfig } from '@/lib/config/countries'
import { calculateTaxSummary } from '@/lib/utils/tax-calculator'
import { formatCurrency } from '@/lib/utils/formatters'
import { supabase } from '@/lib/database/client'

export default function TaxSummary({ userId, countryCode }: {
    userId: string,
    countryCode: string
}) {
    const [summary, setSummary] = useState<any>(null)
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        const loadData = async () => {
            if (!countryCode) return

            const countryConfig = await getCountryConfig(countryCode)
            setConfig(countryConfig)

            const { data: invoices } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', userId)

            if (invoices) {
                const taxSummary = calculateTaxSummary(invoices, countryConfig)
                setSummary(taxSummary)
            }
        }

        loadData()
    }, [userId, countryCode])

    if (!summary || !config) return <div>Cargando resumen fiscal...</div>

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
                Resumen Fiscal - {config.name}
            </h3>

            <div className="space-y-3">
                <div className="flex justify-between">
                    <span>Total gastos este mes:</span>
                    <span className="font-medium">
                        {formatCurrency(summary.totalExpenses, config.currency)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>{config.config.vat_name} recuperable:</span>
                    <span className="text-green-600 font-medium">
                        {formatCurrency(summary.vatRecoverable, config.currency)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span>Deducción {config.config.income_tax_name}:</span>
                    <span className="text-blue-600 font-medium">
                        {formatCurrency(summary.taxDeduction, config.currency)}
                        ({config.config.deduction_percentage}%)
                    </span>
                </div>

                {config.config.monthly_declaration && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            ⏰ Próxima declaración: día {config.config.deadline_day} del próximo mes
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
