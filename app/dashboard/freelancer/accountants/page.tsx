'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function AccountantsPage() {
    const [accountants, setAccountants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function fetchAccountants() {
            // Fetch users where user_type is accountant
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_type', 'accountant')
                .limit(20) // Pagination later

            if (data) {
                setAccountants(data)
            }
            setLoading(false)
        }
        fetchAccountants()
    }, [])

    if (loading) return <div className="p-8">Cargando contadores...</div>

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Directorio de Contadores</h1>
                <p className="text-gray-600 mt-2">Encuentra al profesional ideal para tus impuestos.</p>
            </div>

            {accountants.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-xl text-gray-500">No hay contadores disponibles por el momento.</p>
                    <p className="text-gray-400 mt-2">Vuelve a intentar más tarde.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accountants.map((acc) => (
                        <div key={acc.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                                    {acc.image ? <img src={acc.image} alt={acc.full_name} className="h-full w-full rounded-full object-cover" /> : '💼'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{acc.full_name || acc.email}</h3>
                                    <p className="text-sm text-green-600 font-medium">Contador Certificado</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {acc.accountant_bio || 'Especialista en impuestos para freelancers y PYMES.'}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(acc.accountant_specialization || ['Impuestos', 'PYMES']).map((tag: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="w-full mt-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                onClick={() => window.location.href = `/dashboard/chat?with=${acc.id}`}
                            >
                                Mensaje
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
