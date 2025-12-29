'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function UserTypeSelector({ userId }: { userId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [countries, setCountries] = useState<any[]>([])
    const [selectedCountry, setSelectedCountry] = useState('')
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function loadCountries() {
            const { data } = await supabase.from('countries').select('code, name, currency')
            if (data) {
                setCountries(data)
                // Auto-select Nicaragua if available as default
                if (data.find(c => c.code === 'NI')) setSelectedCountry('NI')
            }
        }
        loadCountries()
    }, [])

    const handleSelect = async (type: 'freelancer' | 'accountant') => {
        if (!selectedCountry) {
            alert('Please select your country first / Por favor selecciona tu país')
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    user_type: type,
                    country_code: selectedCountry
                })
                .eq('id', userId)

            if (error) throw error

            router.refresh()
            router.push(`/dashboard/${type}`)
        } catch (error) {
            console.error('Error updating config:', error)
            alert('Error updating configuration. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Welcome to Fiscion</h1>

            <div className="max-w-md mx-auto mb-12 space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Select your country / Selecciona tu país
                </label>
                <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 border text-lg"
                >
                    <option value="" disabled>Select a country</option>
                    {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                            {country.name} ({country.currency})
                        </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 text-center">
                    This will configure your tax rules and currency automatically.
                </p>
            </div>

            <p className="text-center text-gray-600 mb-8 font-medium">
                How do you plan to use the platform?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                    className={`border rounded-xl p-8 transition-all relative ${!selectedCountry
                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                        : 'hover:border-blue-500 cursor-pointer hover:shadow-lg bg-white'
                        }`}
                    onClick={() => selectedCountry && handleSelect('freelancer')}
                >
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                        👤
                    </div>
                    <h3 className="text-xl font-bold mb-4">I'm a Freelancer</h3>
                    <p className="text-gray-600 mb-6">
                        I want to manage my invoices, expenses, and tax obligations.
                    </p>
                    <button
                        disabled={isLoading || !selectedCountry}
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Choose Freelancer
                    </button>
                </div>

                <div
                    className={`border rounded-xl p-8 transition-all relative ${!selectedCountry
                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                        : 'hover:border-green-500 cursor-pointer hover:shadow-lg bg-white'
                        }`}
                    onClick={() => selectedCountry && handleSelect('accountant')}
                >
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                        💼
                    </div>
                    <h3 className="text-xl font-bold mb-4">I'm an Accountant</h3>
                    <p className="text-gray-600 mb-6">
                        I want to manage multiple clients, review their documents, and file returns.
                    </p>
                    <button
                        disabled={isLoading || !selectedCountry}
                        className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Choose Accountant
                    </button>
                </div>
            </div>
        </div>
    )
}
