'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Upload, FileText, XCircle, Loader2 } from 'lucide-react'
import { uploadFile } from '@/lib/utils/upload-helpers' // We need to ensure we have an upload helper or use supabase storage directly

export default function VerificationPage() {
    const [status, setStatus] = useState<string>('unverified')
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // Form States
    const [idFile, setIdFile] = useState<File | null>(null)
    const [credentialFile, setCredentialFile] = useState<File | null>(null)

    useEffect(() => {
        loadVerificationStatus()
    }, [])

    const loadVerificationStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('users').select('verification_status, verification_documents').eq('id', user.id).single()
            console.log("verification_status", data?.verification_status)
            setStatus(data?.verification_status || 'unverified')
            setDocuments(data?.verification_documents as any[] || [])
        }
        setLoading(false)
    }

    const handleUpload = async () => {
        if (!idFile && !credentialFile) return alert('Selecciona al menos un documento')

        try {
            setUploading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const newDocs = [...documents]

            if (idFile) {
                const path = `verifications/${user.id}/${Date.now()}_id_${idFile.name}`
                const { data, error } = await supabase.storage.from('documents').upload(path, idFile) // Using 'documents' bucket for now
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
                newDocs.push({ type: 'identity_card', url: publicUrl, uploaded_at: new Date() })
            }

            if (credentialFile) {
                const path = `verifications/${user.id}/${Date.now()}_cred_${credentialFile.name}`
                const { data, error } = await supabase.storage.from('documents').upload(path, credentialFile)
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
                newDocs.push({ type: 'professional_credential', url: publicUrl, uploaded_at: new Date() })
            }

            // Update User Profile
            const { error: updateError } = await supabase.from('users').update({
                verification_status: 'pending',
                verification_documents: newDocs
            }).eq('id', user.id)

            if (updateError) throw updateError

            setStatus('pending')
            setDocuments(newDocs)
            setIdFile(null)
            setCredentialFile(null)
            alert('Documentos enviados correctamente. Revisaremos tu perfil en breve.')

        } catch (error: any) {
            console.error(error)
            alert('Error subiendo documentos: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando estado de verificación...</div>

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Verificación Profesional</h1>
                    <p className="text-slate-500">Para garantizar la seguridad de los usuarios, verifica tu identidad y credenciales.</p>
                </div>
                <div>
                    {status === 'verified' && <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2"><CheckCircle className="w-5 h-5 mr-2" /> Verificado</Badge>}
                    {status === 'pending' && <Badge className="bg-yellow-100 text-yellow-700 text-lg px-4 py-2"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> En Revisión</Badge>}
                    {status === 'rejected' && <Badge className="bg-red-100 text-red-700 text-lg px-4 py-2"><XCircle className="w-5 h-5 mr-2" /> Rechazado</Badge>}
                    {status === 'unverified' && <Badge className="bg-slate-100 text-slate-700 text-lg px-4 py-2">No Verificado</Badge>}
                </div>
            </div>

            {status === 'unverified' || status === 'rejected' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText className="text-blue-600" /> Documento de Identidad</CardTitle>
                            <CardDescription>Sube una foto clara de tu Cédula de Identidad o RUC.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="id_file">Archivo de Imagen (JPG, PNG) o PDF</Label>
                                <Input id="id_file" type="file" accept="image/*,application/pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Upload className="text-purple-600" /> Credencial Profesional</CardTitle>
                            <CardDescription>Sube tu Título Universitario, Carnet del CPA o Licencia Profesional.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="cred_file">Archivo de Imagen (JPG, PNG) o PDF</Label>
                                <Input id="cred_file" type="file" accept="image/*,application/pdf" onChange={(e) => setCredentialFile(e.target.files?.[0] || null)} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="col-span-1 md:col-span-2">
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            <AlertTitle>Importante</AlertTitle>
                            <AlertDescription>
                                Tus documentos serán revisados manualmente por nuestro equipo de cumplimiento. La información es confidencial.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end">
                        <Button size="lg" onClick={handleUpload} disabled={uploading || (!idFile && !credentialFile)}>
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Enviar Documentos para Revisión
                        </Button>
                    </div>
                </div>
            ) : (
                <Card className="text-center py-12">
                    <CardContent>
                        {status === 'pending' && (
                            <div className="space-y-4">
                                <Loader2 className="h-16 w-16 text-yellow-500 mx-auto animate-spin" />
                                <h2 className="text-2xl font-bold">Solicitud en Proceso</h2>
                                <p className="text-slate-500 max-w-md mx-auto">Hemos recibido tus documentos. Nuestro equipo los está revisando. Recibirás una notificación cuando tu estado cambie.</p>
                            </div>
                        )}
                        {status === 'verified' && (
                            <div className="space-y-4">
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                                <h2 className="text-2xl font-bold">¡Perfil Verificado!</h2>
                                <p className="text-slate-500 max-w-md mx-auto">Tu identidad profesional ha sido confirmada. Ahora tienes la insignia de "Contador Verificado" visible para todos los clientes.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
