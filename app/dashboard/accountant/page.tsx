'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/database/client'
import { useUser } from '@/lib/auth/useUser'
import ClientList from '@/components/accountant/ClientList'
import Link from 'next/link'
import InviteClientModal from '@/components/accountant/InviteClientModal'

export default function AccountantDashboard() {
    const { user, loading } = useUser()
    const [clients, setClients] = useState<any[]>([])
    const [showInviteModal, setShowInviteModal] = useState(false)

    useEffect(() => {
        if (user) {
            loadClients()
        }
    }, [user])

    const loadClients = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('assigned_accountant_id', user.id)
            .limit(5)

        if (error) console.error("Error loading clients:", error)
        console.log("Clients loaded:", data)
        if (data) setClients(data)
    }

    if (loading) return <div>Cargando...</div>
    if (!user || user.user_type !== 'accountant') return <div>Acceso denegado</div>

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Panel de Contador</h1>
                <p className="text-gray-600">Gestiona tus clientes y reportes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* ... existing stats cards ... */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Clientes</h3>
                    <p className="text-3xl font-bold mt-2">{clients.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Facturas por Revisar</h3>
                    <p className="text-3xl font-bold mt-2 text-yellow-600">12</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Ingresos Estimados</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">$1,200</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Mis Clientes</h2>
                        <Link href="/dashboard/accountant/clients" className="text-blue-600 hover:text-blue-800 text-sm">
                            Ver todos →
                        </Link>
                    </div>
                    <ClientList clients={clients} />
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold mb-4">Acciones Rápidas</h3>
                        <div className="space-y-3">
                            <Link href="/dashboard/accountant/templates" className="block w-full text-center py-2 border rounded hover:bg-gray-50">
                                Gestionar Plantillas
                            </Link>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="block w-full text-center py-2 border rounded hover:bg-gray-50"
                            >
                                Asignar Cliente
                            </button>
                            <Link href="/dashboard/chat" className="block w-full text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Mensajes (Inbox)
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <InviteClientModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                accountantId={user.id}
                accountantName={user.user_metadata?.full_name || 'Contador'}
            />
        </div>
    )
}
