
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import InviteClientModal from '@/components/accountant/InviteClientModal'

export default function AccountantClientsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            // Get accountant profile details if needed (for name)
            const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
            if (profile) {
                user.user_metadata = { ...user.user_metadata, full_name: profile.full_name }
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('assigned_accountant_id', user.id)

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Cargando clientes...</div>

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Clientes</h1>
                <Button onClick={() => setShowInviteModal(true)}>Invitar Cliente</Button>
            </div>

            {clients.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500 mb-4">No tienes clientes asignados aún.</p>
                    <Button variant="outline" onClick={() => setShowInviteModal(true)}>Invitar mi primer cliente</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                        <Card key={client.id}>
                            <CardHeader>
                                <CardTitle>{client.full_name || client.email}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-2">{client.email}</p>
                                <p className="text-sm">Tipo: {client.business_type || 'N/A'}</p>
                                <p className="text-sm">Plan: {client.subscription_plan}</p>
                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/accountant/clients/${client.id}`}>Ver Facturas</Button>
                                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/chat?with=${client.id}`}>Mensaje</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {currentUser && (
                <InviteClientModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    accountantId={currentUser.id}
                    accountantName={currentUser.user_metadata?.full_name || 'Tu Contador'}
                />
            )}
        </div>
    )
}
