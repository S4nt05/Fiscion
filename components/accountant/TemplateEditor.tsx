'use client'

import { useState } from 'react'
import { saveTemplate } from '@/lib/accountant/templates'

const defaultVariables = [
    { key: 'client_name', label: 'Nombre del cliente', example: '{{client_name}}' },
    { key: 'month', label: 'Mes actual', example: '{{month}}' },
    { key: 'total_expenses', label: 'Total gastos', example: '{{total_expenses}}' },
    { key: 'tax_deduction', label: 'Deducción fiscal', example: '{{tax_deduction}}' },
    { key: 'vat_recoverable', label: 'IVA recuperable', example: '{{vat_recoverable}}' },
    { key: 'accountant_name', label: 'Tu nombre', example: '{{accountant_name}}' },
    { key: 'current_date', label: 'Fecha actual', example: '{{current_date}}' },
]

export default function TemplateEditor({
    accountantId,
    accountantName,
    template,
    onSave
}: {
    accountantId: string
    accountantName?: string
    template?: any
    onSave: () => void
}) {
    const [name, setName] = useState(template?.template_name || 'Nueva plantilla')
    const [content, setContent] = useState(
        template?.template_content || {
            header: 'Informe Fiscal - {{month}}',
            body: `Estimado {{client_name}},\n\nRevisé sus facturas de {{month}}.\nTotal gastos: {{total_expenses}}\nDeducción estimada: {{tax_deduction}}\nIVA recuperable: {{vat_recoverable}}`,
            footer: 'Saludos,\n{{accountant_name}}\n{{current_date}}'
        }
    )

    const insertVariable = (variableKey: string) => {
        const textarea = document.getElementById('template-body') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        const newText = content.body.substring(0, start) +
            `{{${variableKey}}}` +
            content.body.substring(end)

        setContent({ ...content, body: newText })

        // Restaurar foco (timeout para que React renderice)
        setTimeout(() => {
            textarea.focus()
            textarea.selectionStart = textarea.selectionEnd = start + variableKey.length + 4
        }, 10)
    }

    const handleSave = async () => {
        try {
            await saveTemplate({
                id: template?.id,
                accountant_id: accountantId,
                template_name: name,
                template_type: 'client_report',
                template_content: content
            })
            alert('Plantilla guardada')
            onSave()
        } catch (error) {
            console.error(error)
            alert('Error al guardar')
        }
    }

    const handlePreview = () => {
        // Usar datos de ejemplo para preview
        const previewData = {
            client_name: 'Juan Pérez',
            month: 'Enero 2024',
            total_expenses: '$1,250.00',
            tax_deduction: '$375.00',
            vat_recoverable: '$187.50',
            accountant_name: accountantName || 'Tu Nombre',
            current_date: new Date().toLocaleDateString('es-NI')
        }

        let previewText = content.body
        Object.entries(previewData).forEach(([key, value]) => {
            previewText = previewText.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        })

        alert('Vista previa:\n\n' + previewText)
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Nombre de la plantilla
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Ej: Informe mensual estándar"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                            Contenido de la plantilla
                        </label>
                        <div className="text-sm text-gray-500">
                            Haz clic en una variable para insertarla
                        </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                        {defaultVariables.map((variable) => (
                            <button
                                key={variable.key}
                                type="button"
                                onClick={() => insertVariable(variable.key)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                title={variable.example}
                            >
                                {variable.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        id="template-body"
                        value={content.body}
                        onChange={(e) => setContent({ ...content, body: e.target.value })}
                        rows={10}
                        className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                        placeholder="Escribe tu plantilla aquí. Usa {{variable}} para datos dinámicos."
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handlePreview}
                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                        Vista Previa
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Guardar Plantilla
                    </button>
                </div>
            </div>
        </div>
    )
}
