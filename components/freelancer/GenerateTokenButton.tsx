'use client'

import { useState } from 'react'
import { supabase } from '@/lib/database/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Copy, Check, Clock } from 'lucide-react'

export default function GenerateTokenButton({ userId }: { userId: string }) {
    const [code, setCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const generateCode = async () => {
        setLoading(true)
        try {
            // Delete old codes first
            await supabase.from('pairing_codes').delete().eq('user_id', userId)

            // Generate 6-digit code
            const newCode = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

            const { error } = await supabase.from('pairing_codes').insert({
                code: newCode,
                user_id: userId,
                expires_at: expiresAt
            })

            if (error) throw error
            setCode(newCode)
        } catch (error) {
            console.error('Error generating token:', error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (code) {
            navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Vincular con Contador
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!code ? (
                    <div className="space-y-4">
                        <p className="text-xs text-blue-600 mb-2">
                            Genera un código temporal para dárselo a tu contador y que pueda agregarte de forma segura.
                        </p>
                        <Button
                            onClick={generateCode}
                            disabled={loading}
                            variant="outline"
                            className="w-full bg-white text-blue-700 hover:bg-blue-50 border-blue-200"
                        >
                            {loading ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : 'Generar Código'}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center space-y-3">
                        <p className="text-xs text-gray-500">Tu código de vinculación:</p>
                        <div className="text-3xl font-mono font-bold tracking-widest text-blue-900 bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                            {code}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="ghost" className="text-xs" onClick={copyToClipboard}>
                                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs text-red-500 hover:text-red-700" onClick={() => setCode(null)}>
                                Cerrar
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400">Válido por 24 horas</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
