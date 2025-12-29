'use client'

import { useState } from 'react'
import { useUser } from '@/lib/auth/useUser'
import TemplateEditor from '@/components/accountant/TemplateEditor'
import TemplateList from '@/components/accountant/TemplateList'

export default function TemplatesPage() {
    const { user } = useUser()
    const [isEditing, setIsEditing] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)

    if (!user) return <div>Cargando...</div>

    const handleNew = () => {
        setEditingTemplate(null)
        setIsEditing(true)
    }

    const handleEdit = (template: any) => {
        setEditingTemplate(template)
        setIsEditing(true)
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Plantillas</h1>
                <button
                    onClick={() => {
                        if (isEditing) {
                            setIsEditing(false)
                            setEditingTemplate(null)
                        } else {
                            handleNew()
                        }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    {isEditing ? 'Cancelar' : 'Nueva Plantilla'}
                </button>
            </div>

            {isEditing ? (
                <TemplateEditor
                    accountantId={user.id}
                    accountantName={user.user_metadata?.full_name}
                    template={editingTemplate}
                    onSave={() => {
                        setIsEditing(false)
                        setEditingTemplate(null)
                        // Trigger reload logic? Simple for now is reload page or use Query
                        window.location.reload()
                    }}
                />
            ) : (
                <div className="space-y-4">
                    <TemplateList accountantId={user.id} onEdit={handleEdit} />
                </div>
            )}
        </div>
    )
}
