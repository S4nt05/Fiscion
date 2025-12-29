
// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { supabase } from '@/lib/database/client'
// import { useSearchParams, useRouter } from 'next/navigation'
// import ConversationList from '@/components/chat/ConversationList'

// export default function ChatPage() {
//     const [user, setUser] = useState<any>(null)
//     const [messages, setMessages] = useState<any[]>([])
//     const [newMessage, setNewMessage] = useState('')
//     const searchParams = useSearchParams()
//     const otherUserId = searchParams.get('with')
//     const router = useRouter()

//     // Use ref to keep track of current conversation for realtime events to avoid needing dependency in useEffect enclosure if possible,
//     // or just rely on the effect teardown.
//     const messagesEndRef = useRef<HTMLDivElement>(null)

//     useEffect(() => {
//         const getUser = async () => {
//             const { data: { user } } = await supabase.auth.getUser()
//             setUser(user)
//         }
//         getUser()
//     }, [])

//     useEffect(() => {
//         if (user?.id && otherUserId) {
//             fetchMessages()
//             const subscription = subscribeToMessages()
//             return () => {
//                 subscription.unsubscribe()
//             }
//         }
//     }, [user, otherUserId])

//     useEffect(() => {
//         scrollToBottom()
//     }, [messages])

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//     }

//     const fetchMessages = async () => {
//         console.log("fetchMessages", user.id)
//         console.log("fetchMessages", otherUserId)
//         if (!user?.id || !otherUserId) return

//         const { data } = await supabase
//             .from('messages')
//             .select('*')
//             .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
//             .order('created_at', { ascending: true })
//         console.log("fetchMessages", data)


//         if (data) setMessages(data)
//     }

//     const subscribeToMessages = () => {
//         return supabase
//             .channel(`chat:${user.id}:${otherUserId}`)
//             .on('postgres_changes',
//                 {
//                     event: 'INSERT',
//                     schema: 'public',
//                     table: 'messages',
//                     filter: `receiver_id=eq.${user.id}` // Listen for messages sent TO me
//                     // Note: Supabase realtime filter limitation -> usually best to listen to all and filter client side if row level security allows
//                     // Or channel per room. simpler to listen to all public messages and filter.
//                 },
//                 (payload) => {
//                     const msg = payload.new
//                     // Check if related to current conversation
//                     if (msg.sender_id === otherUserId || (msg.sender_id === user.id && msg.receiver_id === otherUserId)) {
//                         setMessages(prev => {
//                             // Avoid duplicates just in case
//                             if (prev.find(m => m.id === msg.id)) return prev
//                             return [...prev, msg]
//                         })
//                     }
//                 }
//             )
//             .subscribe()
//     }

//     const sendMessage = async (e: React.FormEvent) => {
//         e.preventDefault()
//         if (!newMessage.trim() || !user?.id || !otherUserId) return

//         const { error } = await supabase
//             .from('messages')
//             .insert({
//                 content: newMessage,
//                 sender_id: user.id,
//                 receiver_id: otherUserId,
//                 read: false,
//                 invoice_ids: []
//             })

//         if (error) console.error('Error sending message:', error)
//         else {
//             setNewMessage('')
//             // Optimistic update
//             // setMessages(prev => [...prev, { 
//             //     content: newMessage, 
//             //     sender_id: user.id, 
//             //     created_at: new Date().toISOString() 
//             // }])
//             // Let the subscription handle it or fetch again? 
//             // Best to just wait for subscription if connection is good.
//             // But for instant feedback, let's fetch or optimistically add.
//             fetchMessages()
//         }
//     }

//     if (!user) return <div className="p-8">Cargando chat...</div>

//     if (!otherUserId) {
//         return (
//             <div className="container mx-auto py-8">
//                 <h1 className="text-2xl font-bold mb-6">Mensajes</h1>
//                 <ConversationList userId={user.id} />
//             </div>
//         )
//     }

//     return (
//         <div className="container mx-auto py-8 h-[calc(100vh-100px)]">
//             <div className="mb-4">
//                 <Button variant="ghost" onClick={() => router.push('/dashboard/chat')}>
//                     ← Volver a la lista
//                 </Button>
//             </div>
//             <Card className="h-full flex flex-col">
//                 <CardHeader>
//                     <CardTitle>Chat</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex-1 flex flex-col overflow-hidden">
//                     <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-md bg-gray-50">
//                         {messages.length === 0 && <p className="text-center text-gray-400 my-4">No hay mensajes aún.</p>}
//                         {messages.map((msg) => (
//                             <div
//                                 key={msg.id}
//                                 className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
//                             >
//                                 <div className={`max-w-[80%] p-3 rounded-lg shadow-sm ${msg.sender_id === user?.id
//                                     ? 'bg-blue-600 text-white'
//                                     : 'bg-white text-gray-800 border'
//                                     }`}>
//                                     <p>{msg.content}</p>
//                                     <p className={`text-[10px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'}`}>
//                                         {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                     </p>
//                                 </div>
//                             </div>
//                         ))}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     <form onSubmit={sendMessage} className="flex gap-2">
//                         <Input
//                             value={newMessage}
//                             onChange={(e) => setNewMessage(e.target.value)}
//                             placeholder="Escribe tu mensaje..."
//                         />
//                         <Button type="submit">Enviar</Button>
//                     </form>
//                 </CardContent>
//             </Card>
//         </div>
//     )
// }
'use client'

import { useState, useEffect, useRef } from 'react'
// ... imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/database/client'
import { useSearchParams, useRouter } from 'next/navigation'
import ConversationList from '@/components/chat/ConversationList'
import { Check, CheckCheck } from 'lucide-react'

export default function ChatPage() {
    const [user, setUser] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const searchParams = useSearchParams()
    const otherUserId = searchParams.get('with')
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) console.error("🔴 Error Auth:", error.message)
            setUser(user)
        }
        getUser()
    }, [])

    // Mark as read when entering chat or when new messages arrive
    useEffect(() => {
        if (user?.id && otherUserId && messages.length > 0) {
            const unreadMessages = messages.some(m => m.receiver_id === user.id && !m.read)
            if (unreadMessages) {
                markMessagesAsRead()
            }
        }
    }, [messages, user, otherUserId])

    useEffect(() => {
        if (user?.id && otherUserId) {
            console.log("⚙️ Iniciando chat entre:", user.id, "y", otherUserId)
            fetchMessages()
            const subscription = subscribeToMessages()
            return () => {
                console.log("🔌 Desconectando suscripción")
                subscription.unsubscribe()
            }
        }
    }, [user, otherUserId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const markMessagesAsRead = async () => {
        if (!user?.id || !otherUserId) return
        console.log("👀 Marcando mensajes como leídos...")
        await supabase
            .from('messages')
            .update({ read: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', otherUserId)
            .eq('read', false)
    }

    const fetchMessages = async () => {
        if (!user?.id || !otherUserId) return

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })

        if (error) {
            console.error("🔴 Error en fetchMessages:", error.message)
        } else {
            setMessages(data || [])
        }
    }

    const subscribeToMessages = () => {
        console.log("📡 Suscribiéndose a cambios en 'messages'...")
        return supabase
            .channel(`chat:${user.id}:${otherUserId}`)
            .on('postgres_changes',
                {
                    event: '*', // Listen to INSERT and UPDATE (for read status)
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const msg = payload.new as any

                    // Filter unrelated messages
                    const isRelated = (msg.sender_id === otherUserId && msg.receiver_id === user.id) ||
                        (msg.sender_id === user.id && msg.receiver_id === otherUserId)

                    if (!isRelated) return

                    if (payload.eventType === 'INSERT') {
                        setMessages(prev => {
                            if (prev.find(m => m.id === msg.id)) return prev
                            return [...prev, msg]
                        })
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
                    }
                }
            )
            .subscribe()
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user?.id || !otherUserId) return

        const { error } = await supabase
            .from('messages')
            .insert({
                content: newMessage,
                sender_id: user.id,
                receiver_id: otherUserId,
                read: false,
                invoice_ids: []
            })

        if (error) {
            console.error('🔴 Error insertando mensaje:', error.message)
        } else {
            setNewMessage('')
            // Realtime will handle the update
        }
    }

    if (!user) return <div className="p-8">Cargando chat...</div>

    if (!otherUserId) {
        return (
            <div className="container mx-auto py-8">
                <h1 className="text-2xl font-bold mb-6">Mensajes</h1>
                <ConversationList userId={user.id} />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 h-[calc(100vh-100px)]">
            <div className="mb-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard/chat')}>
                    ← Volver a la lista
                </Button>
            </div>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-md bg-gray-50">
                        {messages.length === 0 && <p className="text-center text-gray-400 my-4">No hay mensajes aún.</p>}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-3 rounded-lg shadow-sm ${msg.sender_id === user?.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-800 border'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                        <p className="text-[10px]">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {msg.sender_id === user?.id && (
                                            msg.read ? <CheckCheck className="w-3 h-3 text-blue-200" /> : <Check className="w-3 h-3" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                        />
                        <Button type="submit">Enviar</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
