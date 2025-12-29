
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/database/client'

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user logged in')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', user.id)

            // 1. Subir archivo
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Upload failed')
            const { url } = await uploadRes.json()

            // 2. Procesar OCR
            const ocrRes = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: url,
                    userId: user.id,
                    countryCode: 'NI' // TODO: Obtener del perfil del usuario
                })
            })

            if (!ocrRes.ok) throw new Error('OCR failed')

            router.push('/dashboard/freelancer/invoices')
        } catch (error) {
            console.error('Error:', error)
            alert('Error al subir la factura')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>Subir Nueva Factura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                            {file ? (
                                <p className="text-green-600 font-medium">{file.name}</p>
                            ) : (
                                <div>
                                    <p className="text-gray-600">Arrastra tu factura aquí o haz clic</p>
                                    <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG (Max 10MB)</p>
                                </div>
                            )}
                        </label>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Procesando...' : 'Subir y Procesar'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
