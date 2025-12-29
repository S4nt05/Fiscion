'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/database/client'

export default function ChatWindow({
    currentUserId,
    otherUserId,
    otherUserName
}: {
    currentUserId: string
    otherUserId: string
    otherUserName: string
}) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Cargar mensajes iniciales
        const loadMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
        }

        loadMessages()

        // Suscribirse a nuevos mensajes
        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const newMsg = payload.new
                if (
                    (newMsg.sender_id === currentUserId && newMsg.receiver_id === otherUserId) ||
                    (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUserId)
                ) {
                    setMessages(prev => [...prev, newMsg])
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId, otherUserId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        await supabase.from('messages').insert({
            sender_id: currentUserId,
            receiver_id: otherUserId,
            content: newMessage
        })

        setNewMessage('')
    }

    return (
        <div className="flex flex-col h-[500px] border rounded-lg bg-white shadow">
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-800">Chat con {otherUserName}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}>
                                <p>{msg.content}</p>
                                <span className={`text-xs block mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    )
}
