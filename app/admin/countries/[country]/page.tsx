'use client'

import { useState, useEffect } from 'react'
import CountryConfigForm from '@/components/admin/CountryConfigForm'
import { getCountryConfig, updateCountryConfig } from '@/lib/config/countries'

export default function CountryConfigPage({ params }: {
    params: { country: string }
}) {
    const [config, setConfig] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadConfig()
    }, [params.country])

    const loadConfig = async () => {
        try {
            const data = await getCountryConfig(params.country)
            setConfig(data)
        } catch (err) {
            console.error(err)
            setError('Error cargando configuración')
        }
    }

    const handleSave = async (updatedConfig: any) => {
        setIsSaving(true)
        try {
            await updateCountryConfig(params.country, updatedConfig)
            await loadConfig()
            alert('Configuración guardada exitosamente')
        } catch (error: any) {
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!config) return <div className="p-6">Cargando...</div>

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">
                Configuración: {config.name}
            </h1>
            <p className="text-gray-600 mb-6">
                Configura las reglas fiscales, nombres de impuestos y otros parámetros.
            </p>

            <CountryConfigForm
                initialConfig={config.config}
                countryCode={params.country}
                onSave={handleSave}
                isSaving={isSaving}
            />
        </div>
    )
}
