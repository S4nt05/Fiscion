'use client'

import { useState } from 'react'

const defaultFields = [
    { key: 'vat_name', label: 'Nombre del IVA/Impuesto similar', type: 'text' },
    { key: 'vat_rate', label: 'Tasa (%)', type: 'number', min: 0, max: 100 },
    { key: 'income_tax_name', label: 'Nombre del impuesto sobre la renta', type: 'text' },
    { key: 'deduction_percentage', label: 'Porcentaje máximo de deducción', type: 'number', min: 0, max: 100 },
    { key: 'monthly_declaration', label: 'Declaración mensual', type: 'boolean' },
    { key: 'deadline_day', label: 'Día de vencimiento (del mes)', type: 'number', min: 1, max: 31 },
]

export default function CountryConfigForm({
    initialConfig,
    countryCode,
    onSave,
    isSaving
}: {
    initialConfig: any
    countryCode: string
    onSave: (config: any) => Promise<void>
    isSaving: boolean
}) {
    const [config, setConfig] = useState(initialConfig || {})
    const [customFields, setCustomFields] = useState<Array<{ key: string, label: string, type: string, min?: number, max?: number }>>([])

    const handleChange = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleAddField = () => {
        const key = prompt('Clave del campo (sin espacios, inglés):')
        if (!key) return

        const label = prompt('Etiqueta para mostrar:')
        if (!label) return

        const type = prompt('Tipo (text, number, boolean):', 'text')

        setCustomFields([...customFields, { key, label, type: type || 'text' }])
    }

    const allFields = [...defaultFields, ...customFields]

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(config) }}>
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                {allFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                        </label>
                        {field.type === 'boolean' ? (
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={config[field.key] || false}
                                    onChange={(e) => handleChange(field.key, e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="ml-2">Habilitado</span>
                            </label>
                        ) : field.type === 'text' ? (
                            <input
                                type="text"
                                value={config[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        ) : (
                            <input
                                type="number"
                                value={config[field.key] || 0}
                                onChange={(e) => handleChange(field.key, Number(e.target.value))}
                                min={field.min}
                                max={field.max}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        )}
                    </div>
                ))}

                <div className="pt-4 border-t">
                    <button
                        type="button"
                        onClick={handleAddField}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        + Añadir campo personalizado
                    </button>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                    <button
                        type="button"
                        onClick={() => setConfig(initialConfig)}
                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </form>
    )
}
