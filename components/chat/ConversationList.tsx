'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/database/client'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ConversationList({ userId }: { userId: string }) {
    const [conversations, setConversations] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        if (userId) {
            fetchConversations()

            console.log("🔌 Suscribiendo a notificaciones de chat para:", userId)
            const channel = supabase
                .channel(`inbox:${userId}`)
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log("🔔 Nuevo mensaje en inbox:", payload)
                        fetchConversations()
                    }
                )
                .subscribe((status) => {
                    console.log("Estado suscripción inbox:", status)
                })

            return () => { supabase.removeChannel(channel) }
        }
    }, [userId])

    const fetchConversations = async () => {
        // Fetch all messages involving me
        const { data } = await supabase
            .from('messages')
            .select('sender_id, receiver_id, created_at')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false })

        if (!data || data.length === 0) return

        // Extract unique other users & keep track of latest message time if needed (optional optimization)
        const uniqueIds = new Set<string>()
        data.forEach(msg => {
            const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
            if (otherId) uniqueIds.add(otherId)
        })

        if (uniqueIds.size === 0) return
        const idList = Array.from(uniqueIds)

        // Get user details
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name, email, user_type')
            .in('id', idList)

        // Merge found users with IDs. If user profile missing (RLS hidden), use fallback.
        const conversationsInit = idList.map(id => {
            const userProfile = users?.find(u => u.id === id)
            return userProfile || {
                id,
                full_name: 'Usuario Desconocido',
                email: 'Perfil privado o sin asignar',
                user_type: 'unknown'
            }
        })

        setConversations(conversationsInit)
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Conversaciones Recientes</h2>
            {conversations.length === 0 && <p className="text-gray-500">No tienes mensajes.</p>}
            <div className="grid gap-4">
                {conversations.map(user => (
                    <Card
                        key={user.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => router.push(`/dashboard/chat?with=${user.id}`)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">{user.full_name || user.email}</h3>
                                <p className="text-sm text-gray-500 capitalize">{user.user_type}</p>
                            </div>
                            <span className="text-blue-600 text-sm">Abrir Chat →</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
