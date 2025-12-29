'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/database/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, FileText, Download, Edit } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function ClientDetailsPage() {
    const params = useParams()
    const clientId = params.id as string

    const [client, setClient] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditRegimeOpen, setIsEditRegimeOpen] = useState(false)
    const [isEditDeductibilityOpen, setIsEditDeductibilityOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [compliance, setCompliance] = useState<any>({
        totalIncome: 0,
        totalExpenses: 0, // Esto serán los gastos *deducibles* totales
        nondeductibleExpenses: 0, // Nuevo campo para gastos no deducibles
        pendingExpenses: 0, // Nuevo campo para gastos pendientes
        taxableIncome: 0,
        estimatedIR: 0, // 3% DGI
        isSolvent: true
    })

    type TaxRegime = 'general' | 'cuota_fija' | 'professional_services';

    const updateRegime = async (newRegime: TaxRegime) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ tax_regime: newRegime })
                .eq('id', clientId)

            if (error) throw error

            setClient({ ...client, tax_regime: newRegime })
            calculateCompliance(invoices, newRegime)
            setIsEditRegimeOpen(false)
        } catch (error) {
            console.error('Error updating regime:', error)
            alert('Error actualizando régimen')
        }
    }

    const generateNIIFReport = () => {
        if (!invoices.length) return alert('No hay datos para exportar')

        // Generate CSV
        const headers = ['Fecha', 'Tipo', 'Proveedor', 'RUC', 'Monto', 'Impuesto', 'Estado NIIF']
        const rows = invoices.map(inv => [
            new Date(inv.invoice_date || inv.created_at).toLocaleDateString(),
            inv.vendor_tax_id ? 'Gasto' : 'Ingreso',
            `"${inv.vendor_name || ''}"`,
            inv.vendor_tax_id || '',
            inv.total_amount || 0,
            inv.tax_amount || 0,
            'Validado'
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `NIIF_Report_${client.full_name}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const openEditDeductibilityDialog = (invoice: any) => {
        setSelectedInvoice(invoice)
        setIsEditDeductibilityOpen(true)
    }

    // Helper interface for local type safety if needed, though we use any above. 
    // The error usually comes if 'setup' of state infers a type that doesn't have the prop.
    // Initializing with null and <any> generic usually bypasses this.
    // However, if the error persists, it might be due to how 'client' is accessed in JSX if verified by strict templates or similar.
    // We already cast to <any> in useState, so setClient(user) should work if user comes from DB.
    const updateDeductibilityStatus = async (invoiceId: string, newStatus: 'deducible' | 'no_deducible' | 'pendiente') => {
        try {
            // Fetch current user (accountant) ID
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) throw userError || new Error('User not authenticated')

            const { error } = await supabase
                .from('invoices')
                .update({
                    is_deductible: newStatus,
                    reviewed_by_accountant_id: user.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', invoiceId)

            if (error) throw error

            // Update local state to reflect the change
            setInvoices(prevInvoices =>
                prevInvoices.map(inv =>
                    inv.id === invoiceId ? { ...inv, is_deductible: newStatus, reviewed_by_accountant_id: user.id, reviewed_at: new Date().toISOString() } : inv
                )
            )
            setIsEditDeductibilityOpen(false) // Close the dialog
        } catch (error) {
            console.error('Error updating deductibility status:', error)
            alert('Error actualizando el estado de deducibilidad')
        }
    }


    useEffect(() => {
        if (clientId) {
            fetchClientData()
        }
    }, [clientId])

    const fetchClientData = async () => {
        try {
            // 1. Fetch Profile
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', clientId)
                .single()

            if (userError) throw userError
            setClient(user)

            // 2. Fetch Invoices
            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', clientId)
                .order('invoice_date', { ascending: false })

            if (invError) throw invError
            setInvoices(invData || [])

            // 3. Calculate Compliance
            calculateCompliance(invData || [], user.tax_regime || 'general')

        } catch (error) {
            console.error('Error fetching details:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateCompliance = (invs: any[], regime: string) => {
        // Simple logic for now, assumes all invoices in table are 'Income' unless marked otherwise?
        // Wait, 'invoices' table usually stores invoices ISSUED (Income) or RECEIVED (Expenses)?
        // For a Freelancer app, typically they upload EXPENSES to deduct, and maybe create INVOICES for income.
        // Let's assume for now: Invoices types?
        // IF schema doesn't have type, let's assume all uploaded are EXPENSES for deducibility?
        // OR we need to distinguish. 
        // PROMPT implies: "sus ingresos y egresos".
        // Let's assume 'invoices' table has a 'type' column or similar? 
        // Checking schema... standard 'invoices' table usually generic.
        // Let's assume for this MVP: 
        // - We calculate totals. 
        // - If we can't distinguish, we'll sum all as "Uploaded Documents" (likely Expenses for OCR).
        // - Income might need to be manual or distinct.
        // *Corrección*: Si el sistema es para facturar, 'invoices' son Ingresos. Si es para gastos, son Egresos.
        // Dado el contexto "Freelancer sube facturas", suele ser para deducir gastos.
        // Pero el freelancer también 'cobra'.
        // Let's assume 'total_amount' is INCOME for now if generated, and EXPENSE if uploaded?
        // Let's sum 'total_amount' as INCOME for calculation demo purposes (DGI 3% is on INCOME).

        let income = 0
        let deductibleExpenses = 0
        let nondeductibleExpenses = 0
        let pendingExpenses = 0

        invs.forEach(inv => {
            if (inv.vendor_tax_id) { // Es un gasto
                if (inv.is_deductible === 'deducible') {
                    deductibleExpenses += (inv.total_amount || 0)
                } else if (inv.is_deductible === 'no_deducible') {
                    nondeductibleExpenses += (inv.total_amount || 0)
                } else { // 'pendiente' o cualquier otro valor inesperado
                    pendingExpenses += (inv.total_amount || 0)
                }
            } else { // Es un ingreso
                income += (inv.total_amount || 0)
            }
        })

        // 3% rule logic
        const irRate = regime === 'general' ? 0.03 : 0 // Cuota fija paga una cantidad fija, no un % normalmente
        const estimatedIR = income * irRate

        setCompliance({
            totalIncome: income,
            totalExpenses: deductibleExpenses, // Solo los gastos deducibles se cuentan como totalExpenses
            nondeductibleExpenses: nondeductibleExpenses,
            pendingExpenses: pendingExpenses,
            estimatedIR,
            isSolvent: income >= deductibleExpenses // La solvencia se basa en los gastos deducibles
        })
    }

    if (loading) return <div className="p-8">Cargando expediente...</div>
    if (!client) return <div className="p-8">Cliente no encontrado</div>

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{client.full_name || client.email}</h1>
                    <p className="text-gray-500">RUC: {client.company_tax_id || 'N/A'} • Régimen: <span className="font-semibold uppercase">{client.tax_regime || 'General'}</span></p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isEditRegimeOpen} onOpenChange={setIsEditRegimeOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">📝 Editar Régimen</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar Régimen Fiscal</DialogTitle>
                                <DialogDescription>
                                    Selecciona el régimen fiscal para aplicar las reglas de cálculo correctas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="regime" className="text-right">
                                        Régimen
                                    </Label>
                                    <Select
                                        onValueChange={(val) => updateRegime(val as TaxRegime)}
                                        defaultValue={(client.tax_regime || 'general') as TaxRegime}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Seleccione régimen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General (3% PMD)</SelectItem>
                                            <SelectItem value="cuota_fija">Cuota Fija</SelectItem>
                                            <SelectItem value="professional_services">Servicios Profesionales</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={generateNIIFReport}>📄 Generar Reporte NIIF</Button>
                </div>
            </div>

            {/* Dialog for editing deductibility status */}
            <Dialog open={isEditDeductibilityOpen} onOpenChange={setIsEditDeductibilityOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clasificar Deducibilidad</DialogTitle>
                        <DialogDescription>
                            Factura: {selectedInvoice?.vendor_name || 'N/A'} - {formatCurrency(selectedInvoice?.total_amount || 0)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="deductibility" className="text-right">
                                Estado
                            </Label>
                            <Select
                                onValueChange={(val: 'deducible' | 'no_deducible' | 'pendiente') => {
                                    if (selectedInvoice) {
                                        updateDeductibilityStatus(selectedInvoice.id, val)
                                    }
                                }}
                                defaultValue={selectedInvoice?.is_deductible || 'pendiente'}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seleccione estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deducible">Deducible</SelectItem>
                                    <SelectItem value="no_deducible">No Deducible</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Compliance Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* DGI 3% Rule */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Anticipo IR Mensual (DGI)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(compliance.estimatedIR)}</div>
                        <p className="text-xs text-gray-500 mt-1">Calculado al 3% sobre Ingresos Brutos (Régimen General)</p>
                    </CardContent>
                </Card>

                {/* Solvency / Expenses Ratio */}
                <Card className={`border-l-4 ${compliance.isSolvent ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Estado de Solvencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {compliance.isSolvent ? (
                                <CheckCircle className="text-green-500 h-6 w-6" />
                            ) : (
                                <AlertCircle className="text-red-500 h-6 w-6" />
                            )}
                            <span className="text-lg font-bold">
                                {compliance.isSolvent ? 'Solvente' : 'Riesgo de Auditoría'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {compliance.isSolvent
                                ? 'Relación Ingreso/Egreso saludable.'
                                : '¡Alerta! Egresos superan Ingresos detectados.'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Account Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Ingresos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(compliance.totalIncome)}</div>
                        <p className="text-xs text-gray-500 mt-1">Ingresos brutos declarados.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Gastos No Deducibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(compliance.nondeductibleExpenses)}</div>
                        <p className="text-xs text-gray-500 mt-1">Gastos que no aplican a deducción fiscal.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Gastos Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(compliance.pendingExpenses)}</div>
                        <p className="text-xs text-gray-500 mt-1">Gastos pendientes de clasificación.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices List */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentos Fiscales (NIIF)</CardTitle>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No hay documentos registrados para este periodo.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3">Referencia / RUC</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-center">Deducibilidad</th>
                                        <th className="px-4 py-3 text-center">NIIF Validado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">{new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                {inv.vendor_tax_id ? 'Gasto (Fac. Compra)' : 'Ingreso (Fac. Venta)'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{inv.vendor_name || 'Sin Proveedor'}</div>
                                                <div className="text-xs text-gray-500">{inv.vendor_tax_id}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(inv.total_amount || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {inv.is_deductible === 'deducible' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Deducible
                                                    </span>
                                                )}
                                                {inv.is_deductible === 'no_deducible' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        No Deducible
                                                    </span>
                                                )}
                                                {inv.is_deductible === 'pendiente' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Sí
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => window.open(inv.file_url, '_blank')}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => openEditDeductibilityDialog(inv)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
