
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AccountantManager() {
    const [accountants, setAccountants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAccountants()
    }, [])

    const fetchAccountants = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_type', 'accountant')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAccountants(data || [])
        } catch (error) {
            console.error('Error fetching accountants:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleVerification = async (id: string, currentStatus: boolean) => {
        // Aquí podríamos tener un campo 'verified' en el futuro
        // Por ahora simulamos una actualización
        console.log('Toggle verification for', id)
    }

    if (loading) return <div>Cargando contadores...</div>

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Gestión de Contadores</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accountants.map((accountant) => (
                    <Card key={accountant.id}>
                        <CardHeader>
                            <CardTitle>{accountant.full_name || accountant.email}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-2">{accountant.email}</p>
                            <p className="text-sm mb-2">
                                Clientes: {accountant.accountant_clients_count} / {accountant.accountant_max_clients}
                            </p>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleVerification(accountant.id, true)}
                                >
                                    Verificar
                                </Button>
                                <Button variant="destructive" size="sm">
                                    Desactivar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
