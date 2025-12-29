export default function AccountantEditor({ data, onChange }: { data: any, onChange: (newData: any) => void }) {
    const handleChange = (field: string, value: any) => {
        onChange({ ...data, [field]: value })
    }

    return (
        <div className="space-y-4 border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Perfil Profesional (Contador)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Título Profesional</label>
                    <input
                        type="text"
                        value={data?.certification_title || ''}
                        onChange={(e) => handleChange('certification_title', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="ej. Contador Público Autorizado (CPA)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Tarifa por Hora ($)</label>
                    <input
                        type="number"
                        value={data?.hourly_rate || ''}
                        onChange={(e) => handleChange('hourly_rate', parseFloat(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="0.00"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Especialidades (separadas por coma)</label>
                    <input
                        type="text"
                        // Convert array back to string for input
                        value={Array.isArray(data?.specialties) ? data.specialties.join(', ') : (data?.specialties || '')}
                        onChange={(e) => handleChange('specialties', e.target.value.split(',').map((s: string) => s.trim()))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="ej. Auditoría, Impuestos, Consultoría"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Bio Corta</label>
                    <textarea
                        value={data?.bio_short || ''}
                        onChange={(e) => handleChange('bio_short', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="Describe tu experiencia..."
                    />
                </div>
            </div>
        </div>
    )
}
