'use client'

import { useState } from 'react'
import { supabase } from '@/lib/database/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, UserPlus } from 'lucide-react'

interface InviteClientModalProps {
    isOpen: boolean
    onClose: () => void
    accountantId: string
    accountantName: string
}

export default function InviteClientModal({ isOpen, onClose, accountantId, accountantName }: InviteClientModalProps) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleAssign = async () => {
        if (!code || code.length < 6) return
        setLoading(true)
        setMessage(null)

        try {
            // Call the secure RPC function
            const { data, error } = await supabase
                .rpc('assign_client_with_token', { token_code: code.trim() })

            if (error) throw error

            // Cast data to expected shape
            const result = data as { success: boolean; error?: string }

            // Check the custom response from our function
            if (!result || !result.success) {
                if (result?.error === 'INVALID_TOKEN') {
                    setMessage({ type: 'error', text: 'Código inválido o expirado.' })
                    return
                }
                throw new Error(result?.error || 'Error desconocido')
            }

            setMessage({ type: 'success', text: '¡Cliente vinculado exitosamente!' })
            setTimeout(() => {
                onClose()
                window.location.reload()
            }, 1500)

        } catch (err: any) {
            console.error('Assignment error:', err)
            setMessage({ type: 'error', text: 'Error al vincular: ' + (err.message || 'Intente nuevamente') })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Vincular Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Ingresa el código de 6 dígitos que te proporcionó el freelancer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ej: 123456"
                            value={code}
                            maxLength={6}
                            onChange={(e) => setCode(e.target.value)}
                            className="text-center text-lg tracking-widest uppercase"
                        />
                        <Button onClick={handleAssign} disabled={loading || code.length < 6}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                    </div>

                    {message && (
                        <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
