export default function FreelancerEditor({ data, onChange, labels }: { data: any, onChange: (newData: any) => void, labels?: any }) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...data, [field]: value })
    }

    return (
        <div className="space-y-4 border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Información Fiscal (Freelancer)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{labels?.tax_id_label || 'RUC / ID Fiscal'}</label>
                    <input
                        type="text"
                        value={data?.fiscal_id || ''}
                        onChange={(e) => handleChange('fiscal_id', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="ej. 001-200585-0000L"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{labels?.tax_regime_label || 'Régimen Fiscal'}</label>
                    <input
                        type="text"
                        value={data?.tax_regime || ''}
                        onChange={(e) => handleChange('tax_regime', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="ej. Cuota Fija"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{labels?.industry_label || 'Industria / Actividad'}</label>
                    <input
                        type="text"
                        value={data?.industry || ''}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="ej. Desarrollo de Software"
                    />
                </div>
            </div>
        </div>
    )
}
