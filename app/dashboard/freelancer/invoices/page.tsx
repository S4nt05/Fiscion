
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function FreelancerInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoices()
    }, [])

    const fetchInvoices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setInvoices(data || [])
        } catch (error) {
            console.error('Error fetching invoices:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Facturas</h1>
                <Link href="/dashboard/freelancer/upload">
                    <Button>Subir Factura</Button>
                </Link>
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">No has subido ninguna factura.</p>
                    <Link href="/dashboard/freelancer/upload">
                        <Button variant="outline">Comenzar ahora</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {invoices.map((invoice) => (
                        <Card key={invoice.id}>
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="font-medium">{invoice.vendor_name || 'Proveedor desconocido'}</p>
                                    <p className="text-sm text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">
                                        {invoice.currency} {invoice.total_amount?.toFixed(2)}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${invoice.status === 'processed' ? 'bg-green-100 text-green-800' :
                                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
