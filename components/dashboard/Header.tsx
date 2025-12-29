'use client'

import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'

// ... imports
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/database/client'

export default function DashboardHeader() {
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchUnread = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Initial fetch
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('read', false)

            setUnreadCount(count || 0)

            // Subscription
            const channel = supabase
                .channel('header_badge')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
                    () => fetchUnread()
                )
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
        fetchUnread()
    }, [])

    return (
        <header className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">Fiscion</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-4">
                            <Link href="/dashboard/chat" className="text-gray-600 hover:text-blue-600 font-medium relative">
                                Mensajes
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/dashboard/profile" className="text-gray-600 hover:text-blue-600 font-medium">
                                Mi Perfil
                            </Link>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    )
}
