'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/database/client'
import { useUser } from '@/lib/auth/useUser'
import TaxSummary from '@/components/dashboard/TaxSummary'
import InvoiceList from '@/components/invoice/InvoiceList'
import PlanUsage from '@/components/dashboard/PlanUsage'
import QuickActions from '@/components/dashboard/QuickActions'
import GenerateTokenButton from '@/components/freelancer/GenerateTokenButton'
import { checkUploadLimit } from '@/lib/utils/plan-limits'
import { formatCurrency } from '@/lib/utils/formatters'

export default function FreelancerDashboard() {
    const { user, loading } = useUser()
    const [invoices, setInvoices] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, thisMonth: 0 })
    const [canUploadMore, setCanUploadMore] = useState(true)

    useEffect(() => {
        if (user) {
            loadInvoices()
            checkUploadLimit(user.id).then(setCanUploadMore)
        }
    }, [user])

    const loadInvoices = async () => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('invoice_date', { ascending: false })
            .limit(50)

        if (!error && data) {
            setInvoices(data)

            // Calcular stats
            const thisMonth = new Date().getMonth()
            const thisYear = new Date().getFullYear()

            const thisMonthInvoices = data.filter((inv: any) => {
                const invDate = new Date(inv.invoice_date || inv.created_at)
                return invDate.getMonth() === thisMonth &&
                    invDate.getFullYear() === thisYear
            })

            const totalThisMonth = thisMonthInvoices.reduce((sum: number, inv: any) =>
                sum + (inv.total_amount || 0), 0
            )

            setStats({
                total: data.length,
                thisMonth: totalThisMonth
            })
        }
    }

    if (loading) return <div>Cargando...</div>
    if (!user) return <div>No autenticado</div>

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Dashboard Fiscal
                </h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido, {user.full_name}. Aquí está tu resumen fiscal.
                </p>
            </div>

            {/* Alertas y límites */}
            {!canUploadMore && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            ⚠️
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Has alcanzado tu límite de facturas este mes ({user.invoice_limit}).
                                <a href="/pricing" className="ml-1 font-medium underline">
                                    Actualizar plan
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda: Resumen y acciones */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tarjetas de estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-lg shadow border">
                            <h3 className="text-sm font-medium text-gray-500">Total Facturas</h3>
                            <p className="text-2xl font-bold mt-2">{stats.total}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow border">
                            <h3 className="text-sm font-medium text-gray-500">Gastos este mes</h3>
                            <p className="text-2xl font-bold mt-2">
                                {formatCurrency(stats.thisMonth, user.currency_code)}
                            </p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow border">
                            <h3 className="text-sm font-medium text-gray-500">Estado del plan</h3>
                            <p className="text-lg font-semibold mt-2 capitalize">{user.subscription_plan || 'Free'}</p>
                            <PlanUsage
                                current={user.invoices_this_month || 0}
                                max={user.invoice_limit || 10}
                            />
                        </div>
                    </div>

                    {/* Resumen fiscal con configuración del país */}
                    <TaxSummary
                        userId={user.id}
                        countryCode={user.country_code || 'NI'}
                    />

                    {/* Acciones rápidas */}
                    <GenerateTokenButton userId={user.id} />

                    <QuickActions
                        canUpload={canUploadMore}
                        hasAccountant={!!user.assigned_accountant_id}
                        countryCode={user.country_code || 'NI'}
                    />
                </div>

                {/* Columna derecha: Últimas facturas */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow border">
                        <div className="p-5 border-b">
                            <h3 className="text-lg font-semibold">Facturas Recientes</h3>
                            <p className="text-sm text-gray-500">Últimas 10 facturas subidas</p>
                        </div>
                        <div className="p-4">
                            <InvoiceList
                                invoices={invoices.slice(0, 10)}
                                compact={true}
                            />
                            {invoices.length > 10 && (
                                <a
                                    href="/dashboard/freelancer/invoices"
                                    className="block text-center mt-4 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Ver todas las facturas →
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Sección de contador asignado */}
                    {user.assigned_accountant_id && (
                        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-5">
                            <h3 className="font-semibold text-blue-900">Tu contador asignado</h3>
                            <p className="text-sm text-blue-700 mt-2">
                                Tienes un contador asignado para ayudarte con tus declaraciones.
                            </p>
                            <a
                                href="/dashboard/chat"
                                className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                                Contactar contador
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
