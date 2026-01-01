'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/database/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Edit, Save, CheckCircle, AlertCircle, Eye, FileText, ClipboardCheck, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type InvoiceStatus = 'deducible' | 'no_deducible' | 'pendiente';

export default function ClientDetailsPage() {
    const params = useParams()
    const clientId = params.id as string

    const [client, setClient] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditRegimeOpen, setIsEditRegimeOpen] = useState(false)
    const [isEditDeductibilityOpen, setIsEditDeductibilityOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    // ESTADOS DE EDICIÓN
    const [editDate, setEditDate] = useState('')
    const [editNumber, setEditNumber] = useState('')
    const [editVendor, setEditVendor] = useState('')
    const [editTaxId, setEditTaxId] = useState('')
    const [editSubtotal, setEditSubtotal] = useState<number>(0)
    const [editIVA, setEditIVA] = useState<number>(0)
    const [editRetention, setEditRetention] = useState<number>(0)
    const [editTotal, setEditTotal] = useState<number>(0)
    const [editStatus, setEditStatus] = useState<InvoiceStatus>('pendiente')
    const [editNiifSection, setEditNiifSection] = useState('') // Para validación NIIF manual

    const [compliance, setCompliance] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        nondeductibleExpenses: 0,
        pendingExpenses: 0,
        estimatedIR: 0,
        isSolvent: true
    })

    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false)
    const [auditorAnalysis, setAuditorAnalysis] = useState('')


    // Auto-calculation removed.


    const calculateCompliance = (invs: any[], regime: string) => {
        let income = 0, deductible = 0, nondeductible = 0, pending = 0
        invs.forEach(inv => {
            const amount = Number(inv.total_amount) || 0
            if (inv.vendor_tax_id || inv.invoice_number) {
                if (inv.is_deductible === 'deducible') deductible += amount
                else if (inv.is_deductible === 'no_deducible') nondeductible += amount
                else pending += amount
            } else { income += amount }
        })
        const irRate = regime === 'general' ? 0.03 : 0.01
        setCompliance({
            totalIncome: income,
            totalExpenses: deductible,
            nondeductibleExpenses: nondeductible,
            pendingExpenses: pending,
            estimatedIR: income * irRate,
            isSolvent: income >= deductible
        })
    }

    const fetchClientData = async () => {
        try {
            console.log('Fetching client data:', clientId)
            const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', clientId).single()
            if (userError) console.error('Error fetching user:', userError)
            console.log('User data:', user)

            setClient(user)

            const { data: invData, error: invError } = await supabase.from('invoices').select('*').eq('user_id', clientId).order('invoice_date', { ascending: false })
            if (invError) console.error('Error fetching invoices:', invError)
            console.log('Invoices data:', invData)

            setInvoices(invData || [])
            calculateCompliance(invData || [], user?.tax_regime || 'general')
        } catch (error) { console.error(error) } finally { setLoading(false) }
    }

    const updateRegime = async (newRegime: "general" | "cuota_fija" | "professional_services" | null) => {
        const { error } = await supabase.from('users').update({ tax_regime: newRegime as any }).eq('id', clientId)
        if (!error) {
            setClient({ ...client, tax_regime: newRegime })
            calculateCompliance(invoices, newRegime || 'general')
            setIsEditRegimeOpen(false)
        }
    }

    const saveFullAdjustment = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            const updatedFields = {
                invoice_date: editDate || null,
                invoice_number: editNumber || null,
                vendor_name: editVendor,
                vendor_tax_id: editTaxId,
                subtotal_amount: editSubtotal,
                tax_amount: editIVA,
                retention_tax: editRetention,
                total_amount: editTotal,
                is_deductible: editStatus,
                niif_validation_section: editNiifSection, // Persistencia NIIF
                reviewed_by_accountant_id: authUser?.id,
                reviewed_at: new Date().toISOString()
            }

            const { error } = await supabase.from('invoices').update(updatedFields).eq('id', selectedInvoice.id)
            if (error) throw error

            const updatedInvoices = invoices.map(inv => inv.id === selectedInvoice.id ? { ...inv, ...updatedFields } : inv)
            setInvoices(updatedInvoices)
            calculateCompliance(updatedInvoices, client.tax_regime)
            setIsEditDeductibilityOpen(false)
        } catch (error: any) {
            console.error('Error al guardar:', error);
            alert(`Error al guardar: ${error.message || JSON.stringify(error)}`);
        }
    }



    const generatePDFReport = () => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width

        // --- 1. ENCABEZADO OFICIAL ---
        doc.setFillColor(41, 128, 185) // Corporate Blue
        doc.rect(0, 0, pageWidth, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('Informe Financiero & Fiscal Mensual', 14, 20)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Generado para: ${client?.full_name?.toUpperCase()}`, 14, 30)
        doc.text(`RUC: ${client?.vendor_tax_id || 'N/A'} • Régimen: ${client?.tax_regime?.toUpperCase()}`, 14, 35)

        // --- 2. CARTA A LA GERENCIA (DICTAMEN) ---
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('1. DICTAMEN DEL AUDITOR / NOTAS A LOS ESTADOS', 14, 55)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const splitText = doc.splitTextToSize(auditorAnalysis || 'Sin notas del auditor para este período.', pageWidth - 28)
        doc.text(splitText, 14, 62)

        let currentY = 62 + (splitText.length * 5) + 10

        // --- 3. RESUMEN EJECUTIVO TIPO DGI (BORRADOR) ---
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('2. BORRADOR DE DECLARACIÓN (Estimación DGI)', 14, currentY)
        currentY += 8

        // Cálculos DGI
        const rate = client?.tax_regime === 'cuota_fija' ? 0.01 : 0.03 // Simplificación
        const irPayable = compliance.totalIncome * rate
        // Asumimos que tax_amount en facturas deducibles es el crédito fiscal real
        const ivaCredit = invoices.filter(i => i.is_deductible === 'deducible').reduce((sum, i) => sum + (i.tax_amount || 0), 0)
        // Estimación: IVA Débito es 15% de ingresos (si aplica) - esto es una aproximación para la demo
        const ivaDebit = client?.tax_regime !== 'cuota_fija' ? compliance.totalIncome * 0.15 : 0
        const ivaPayable = Math.max(0, ivaDebit - ivaCredit)

        const dgiData = [
            ['CONCEPTO', 'BASE IMPONIBLE', 'ALÍCUOTA', 'IMPUESTO A PAGAR'],
            ['Anticipo IR Mensual (Renta)', formatCurrency(compliance.totalIncome), `${(rate * 100).toFixed(0)}%`, formatCurrency(irPayable)],
            ['IVA Débito (Ventas Est.)', formatCurrency(compliance.totalIncome), '15%', formatCurrency(ivaDebit)],
            ['(-) IVA Crédito (Compras)', formatCurrency(compliance.totalExpenses), '-', `(${formatCurrency(ivaCredit)})`],
            ['TOTAL IVA A PAGAR', '', '', formatCurrency(ivaPayable)],
            ['TOTAL GENERAL A PAGAR EN DGI', '', '', formatCurrency(irPayable + ivaPayable)]
        ]

        autoTable(doc, {
            startY: currentY,
            head: [dgiData[0]],
            body: dgiData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            columnStyles: { 3: { fontStyle: 'bold', halign: 'right' }, 1: { halign: 'right' } }
        })

        currentY = (doc as any).lastAutoTable.finalY + 15

        // --- 4. DETALLE DE GASTOS ---
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('3. DETALLE DE GASTOS REGISTRADOS', 14, currentY)

        const tableBody = invoices.map(inv => [
            new Date(inv.invoice_date || inv.created_at).toLocaleDateString(),
            inv.vendor_name || 'Desconocido',
            inv.invoice_number || 'S/N',
            formatCurrency(inv.total_amount || 0),
            inv.is_deductible === 'deducible' ? 'Si' : 'No',
            inv.niif_validation_section || '-'
        ])

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Fecha', 'Proveedor', 'Factura', 'Monto', 'Deducible', 'NIIF']],
            body: tableBody,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [127, 140, 141] }
        })

        // Pie de Página
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.text('Documento Interno - Sujeto a revisión final en la declaración.', 14, 285)
            doc.text(`Pág ${i}/${pageCount}`, 190, 285, { align: 'right' })
        }

        doc.save(`Estado_DGI_${client?.full_name}_${new Date().toISOString().split('T')[0]}.pdf`)
        setAuditorAnalysis('')
        setIsClosingModalOpen(false)
    }

    useEffect(() => { if (clientId) fetchClientData() }, [clientId])

    if (loading) return <div className="p-8 text-center font-bold">Cargando expediente fiscal y NIIF...</div>
    if (!client) return <div className="p-8 text-center text-red-500 font-bold">Error: No se encontró el cliente o no tienes permisos para verlo. (ID: {clientId})</div>

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Encabezado */}
            <div className="flex justify-between items-end bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{client?.full_name}</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase">RUC: {client?.vendor_tax_id || 'Natural'} • RÉGIMEN: {client?.tax_regime}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-blue-600 text-blue-600" onClick={() => setIsEditRegimeOpen(true)}>Editar Régimen</Button>
                </div>
            </div>

            {/* Widgets de Montos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-bold">
                <Card className="bg-blue-50 border-blue-200 text-blue-700">
                    <CardHeader className="py-2 text-xs uppercase">Ingresos Totales</CardHeader>
                    <CardContent className="text-2xl">{formatCurrency(compliance.totalIncome)}</CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200 text-green-700">
                    <CardHeader className="py-2 text-xs uppercase">Gastos Deducibles</CardHeader>
                    <CardContent className="text-2xl">{formatCurrency(compliance.totalExpenses)}</CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200 text-red-700">
                    <CardHeader className="py-2 text-xs uppercase">No Deducibles</CardHeader>
                    <CardContent className="text-2xl">{formatCurrency(compliance.nondeductibleExpenses)}</CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200 text-yellow-700">
                    <CardHeader className="py-2 text-xs uppercase">Pendientes Auditoría</CardHeader>
                    <CardContent className="text-2xl">{formatCurrency(compliance.pendingExpenses)}</CardContent>
                </Card>
            </div>

            {/* Componente de Evaluación Fiscal y NIIF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-t-4 border-t-blue-600">
                    <CardHeader><CardTitle className="text-sm font-bold uppercase">Proyección Fiscal (IR)</CardTitle></CardHeader>
                    <CardContent className="space-y-3 font-semibold">
                        <div className="flex justify-between p-3 bg-slate-50 rounded">
                            <span>Impuesto a Pagar Estimado:</span>
                            <span className="text-blue-600 text-lg">{formatCurrency(compliance.estimatedIR)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-50 rounded">
                            <span>Estado de Solvencia:</span>
                            {compliance.isSolvent ? <span className="text-green-600">SOLVENTE</span> : <span className="text-red-600">DÉFICIT</span>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-purple-600">
                    <CardHeader><CardTitle className="text-sm font-bold uppercase">Revisión Técnica NIIF PYMES</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-xs text-slate-500 italic mb-2 text-justify">
                            De acuerdo a la Sección 3, se evalúa la razonabilidad de los gastos. El contador debe validar partidas que afecten la Sección 13 (Inventarios) o Sección 17 (Propiedades).
                        </div>
                        <Button className="w-full bg-purple-600" onClick={() => setIsClosingModalOpen(true)}>Iniciar Cierre Mensual & Reporte</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de Documentos con campos requeridos */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 border-b">
                            <tr>
                                <th className="p-4 text-left">N° Factura</th>
                                <th className="p-4 text-left">Cliente/Proveedor</th>
                                <th className="p-4 text-left">RUC</th>
                                <th className="p-4 text-left">Fecha</th>
                                <th className="p-4 text-center">Deducibilidad</th>
                                <th className="p-4 text-right">Subtotal</th>
                                <th className="p-4 text-right">IVA</th>
                                <th className="p-4 text-right text-rose-600">Retención</th>
                                <th className="p-4 text-right font-black">Total</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold">{inv.invoice_number || 'S/N'}</td>
                                    <td className="p-4">{inv.vendor_name}</td>
                                    <td className="p-4 font-mono">{inv.vendor_tax_id || '---'}</td>
                                    <td className="p-4">{inv.invoice_date || '---'}</td>
                                    <td className="p-4 text-center">
                                        {inv.is_deductible === 'deducible' && <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">Deducible</span>}
                                        {inv.is_deductible === 'no_deducible' && <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-bold">No Deducible</span>}
                                        {(!inv.is_deductible || inv.is_deductible === 'pendiente') && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-bold">Pendiente</span>}
                                    </td>
                                    <td className="p-4 text-right">{formatCurrency(inv.subtotal_amount)}</td>
                                    <td className="p-4 text-right">{formatCurrency(inv.tax_amount)}</td>
                                    <td className="p-4 text-right text-rose-500">{formatCurrency(inv.retention_tax || 0)}</td>
                                    <td className="p-4 text-right font-black">{formatCurrency(inv.total_amount)}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex gap-1 justify-center">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => {
                                                setSelectedInvoice(inv);
                                                setEditDate(inv.invoice_date || '');
                                                setEditNumber(inv.invoice_number || '');
                                                setEditVendor(inv.vendor_name || '');
                                                setEditTaxId(inv.vendor_tax_id || '');
                                                setEditSubtotal(Number(inv.subtotal_amount) || 0);
                                                setEditIVA(Number(inv.tax_amount) || 0);
                                                setEditRetention(Number(inv.retention_tax) || 0);
                                                setEditTotal(Number(inv.total_amount) || 0);
                                                setEditStatus(inv.is_deductible as InvoiceStatus);
                                                setEditNiifSection(inv.niif_validation_section || '');
                                                setIsEditDeductibilityOpen(true);
                                            }}><Edit className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600" onClick={() => window.open(inv.file_url, '_blank')}><Eye className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600" onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = inv.file_url;
                                                link.download = `Factura_${inv.invoice_number}.pdf`;
                                                link.click();
                                            }}><Download className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Modal de Auditoría y Validación NIIF */}
            <Dialog open={isEditDeductibilityOpen} onOpenChange={setIsEditDeductibilityOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="text-blue-600" /> Auditoría Profesional</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-1"><Label>Nombre Cliente / Proveedor</Label><Input value={editVendor} onChange={(e) => setEditVendor(e.target.value)} /></div>
                        <div className="space-y-1"><Label>RUC</Label><Input value={editTaxId} onChange={(e) => setEditTaxId(e.target.value)} /></div>
                        <div className="space-y-1"><Label>N° Factura</Label><Input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} /></div>
                        <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></div>
                        <div className="space-y-1"><Label>Monto antes IVA (Subtotal)</Label><Input type="number" step="0.01" value={editSubtotal} onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditSubtotal(val);
                            setEditTotal(val + editIVA - editRetention);
                        }} /></div>
                        <div className="space-y-1"><Label>IVA</Label><Input type="number" step="0.01" value={editIVA} onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditIVA(val);
                            setEditTotal(editSubtotal + val - editRetention);
                        }} /></div>
                        <div className="space-y-1 text-rose-600"><Label>Retención Aplicada</Label><Input type="number" step="0.01" value={editRetention} onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditRetention(val);
                            setEditTotal(editSubtotal + editIVA - val);
                        }} /></div>
                        <div className="space-y-1"><Label className="font-bold">Total Neto</Label><Input value={editTotal} disabled className="bg-slate-50" /></div>

                        {/* SECCIÓN NIIF ESPECÍFICA */}
                        <div className="col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-2">
                            <Label className="text-purple-800 font-bold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Validación Técnica NIIF PYMES</Label>
                            <Select value={editNiifSection} onValueChange={setEditNiifSection}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar Sección NIIF a validar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="seccion_13">Sección 13: Inventarios (Costo de Ventas)</SelectItem>
                                    <SelectItem value="seccion_17">Sección 17: Propiedad, Planta y Equipo</SelectItem>
                                    <SelectItem value="seccion_23">Sección 23: Ingresos de Actividades Ordinarias</SelectItem>
                                    <SelectItem value="gasto_operativo">Gasto Operativo Estándar</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-purple-600">Esta validación manual confirma que el documento cumple con el principio de devengo y medición.</p>
                        </div>

                        <div className="col-span-2 space-y-1 pt-2">
                            <Label>Clasificación de Deducibilidad</Label>
                            <Select value={editStatus} onValueChange={(v: InvoiceStatus) => setEditStatus(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deducible">✅ Gasto Deducible</SelectItem>
                                    <SelectItem value="no_deducible">❌ No Deducible</SelectItem>
                                    <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={saveFullAdjustment} className="w-full bg-blue-700 h-12 font-bold text-lg">Guardar Cambios en Base de Datos</Button>
                </DialogContent>
            </Dialog>

            {/* Modal Régimen */}
            <Dialog open={isEditRegimeOpen} onOpenChange={setIsEditRegimeOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Cambio de Régimen Fiscal</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-1 gap-3 py-4">
                        <Button onClick={() => updateRegime('general')} variant={client?.tax_regime === 'general' ? 'default' : 'outline'} className="h-16">Régimen General (3%)</Button>
                        <Button onClick={() => updateRegime('cuota_fija')} variant={client?.tax_regime === 'cuota_fija' ? 'default' : 'outline'} className="h-16">Cuota Fija / Simplificado (1%)</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal ASIENTENTE DE CIERRE (Nuevo) */}
            <Dialog open={isClosingModalOpen} onOpenChange={setIsClosingModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="text-purple-600" />
                            Asistente de Cierre Mensual & Reporte
                        </DialogTitle>
                        <DialogDescription>
                            Redacta tu dictamen profesional. Este texto aparecerá como "Carta a la Gerencia" en el reporte PDF.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="font-bold">Análisis del Auditor / Notas a los Estados (Dictamen)</Label>
                            <textarea
                                className="w-full min-h-[200px] p-4 text-sm border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                placeholder="Ej: He revisado las facturas de gastos y recomiendo poner atención a los soportes de caja chica. Las retenciones aplicadas son correctas..."
                                value={auditorAnalysis}
                                onChange={(e) => setAuditorAnalysis(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 text-right">{auditorAnalysis.length} caracteres</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded border text-sm space-y-1">
                            <p className="font-bold text-slate-700">Se generará un reporte PDF conteniendo:</p>
                            <ul className="list-disc list-inside text-slate-600 pl-2">
                                <li>Encabezado Corporativo y Datos del Cliente.</li>
                                <li>Tu Análisis/Dictamen (escrito arriba).</li>
                                <li>Tabla de Cálculo DGI (Renta, IVA Débito/Crédito).</li>
                                <li>Detalle de Facturas Auditadas.</li>
                            </ul>
                        </div>
                    </div>
                    <Button onClick={generatePDFReport} className="w-full bg-purple-700 h-12 font-bold text-lg hover:bg-purple-800">
                        <Download className="mr-2 h-5 w-5" />
                        Generar y Descargar Reporte Oficial
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}