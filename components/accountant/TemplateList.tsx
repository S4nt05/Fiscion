'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TemplateList({ accountantId, onEdit }: { accountantId: string, onEdit: (t: any) => void }) {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (accountantId) fetchTemplates()
    }, [accountantId])

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from('accountant_templates')
            .select('*')
            .eq('accountant_id', accountantId)
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching templates:', error)
        if (data) setTemplates(data)
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return

        const { error } = await supabase
            .from('accountant_templates')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error al eliminar')
            console.error(error)
        } else {
            fetchTemplates()
        }
    }

    if (loading) return <div>Cargando plantillas...</div>

    if (templates.length === 0) {
        return (
            <div className="bg-white p-8 text-center text-gray-500 rounded shadow">
                <p>No tienes plantillas guardadas. Selecciona "Nueva Plantilla" para comenzar.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {templates.map(template => (
                <Card key={template.id}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Creado: {new Date(template.created_at).toLocaleDateString()}
                        </p>
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono line-clamp-3 mb-4 h-20 overflow-hidden text-ellipsis">
                            {template.template_content?.body || 'Sin contenido'}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                                Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                                Eliminar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
