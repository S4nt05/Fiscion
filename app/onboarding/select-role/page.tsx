'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Catalogs
    const [countries, setCountries] = useState<any[]>([])
    const [userTypes, setUserTypes] = useState<any[]>([])

    // Form
    const [formData, setFormData] = useState({
        full_name: '',
        user_type: '',
        country_code: ''
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function loadCatalogs() {
            setLoading(true)
            // Load Countries
            const { data: countriesData } = await supabase
                .from('countries')
                .select('code, name, currency')
                .order('name')

            // Load User Types
            const { data: typesData } = await supabase
                .from('user_types')
                .select('code, name')
                .eq('is_visible', true) // Only show visible types (hides admin)
                .order('name')

            // Load current user name if available
            const { data: { user } } = await supabase.auth.getUser()
            let currentName = ''
            if (user) {
                const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
                currentName = profile?.full_name || user.user_metadata?.full_name || ''
            }

            if (countriesData) setCountries(countriesData)
            if (typesData) setUserTypes(typesData)
            setFormData(prev => ({ ...prev, full_name: currentName }))

            setLoading(false)
        }
        loadCatalogs()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.user_type || !formData.country_code || !formData.full_name) {
            alert('Please fill all fields / Por favor complete todos los campos')
            return
        }

        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: formData.full_name,
                    user_type: formData.user_type,
                    country_code: formData.country_code,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            // Redirect to dashboard
            router.refresh() // Clear cache
            router.push('/dashboard')
        } catch (error) {
            console.error('Onboarding Error:', error)
            alert('Error saving profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p>Loading configuration...</p>
        </div>
    )

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Bienvenido a Fiscion</h1>
                    <p className="text-gray-500 mt-2">
                        Configura tu perfil para comenzar. Esta información es necesaria para tus impuestos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre Completo (Real)
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Country Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                País de Residencia Fiscal
                            </label>
                            <select
                                required
                                value={formData.country_code}
                                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Seleccionar País...</option>
                                {countries.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.name} ({c.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* User Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Perfil
                            </label>
                            <select
                                required
                                value={formData.user_type}
                                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Seleccionar Rol...</option>
                                {userTypes.map(t => (
                                    <option key={t.code} value={t.code}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                *Esto no se puede cambiar después fácilmente.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg shadow-lg"
                        >
                            {saving ? 'Guardando Configuración...' : 'Comenzar →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
