'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any[]>([])
    const [totalSpent, setTotalSpent] = useState(0)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function loadReports() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: invoices } = await supabase
                .from('invoices')
                .select('total_amount, invoice_date')
                .eq('user_id', user.id)
                .order('invoice_date', { ascending: true })

            if (invoices) {
                // Aggregate by month
                const monthlyData: Record<string, number> = {}
                let total = 0

                invoices.forEach(inv => {
                    const date = new Date(inv.invoice_date || new Date())
                    const monthKey = date.toLocaleString('default', { month: 'short' })
                    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(inv.total_amount)
                    total += Number(inv.total_amount)
                })

                const chartData = Object.keys(monthlyData).map(key => ({
                    name: key,
                    gastos: monthlyData[key]
                }))

                setStats(chartData)
                setTotalSpent(total)
            }
            setLoading(false)
        }
        loadReports()
    }, [])

    if (loading) return <div className="p-8">Calculando reportes...</div>

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Reportes Financieros</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Gasto Total (Año)</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">${totalSpent.toFixed(2)}</p>
                </div>
                {/* Add more cards here */}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border h-[400px]">
                <h3 className="text-lg font-bold mb-4">Evolución de Gastos</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={stats}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="gastos" fill="#3b82f6" name="Gastos Mensuales" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
