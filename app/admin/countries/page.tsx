
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CountriesPage() {
    const [countries, setCountries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCountries()
    }, [])

    const fetchCountries = async () => {
        try {
            const { data, error } = await supabase
                .from('countries')
                .select('*')
                .order('name')

            if (error) throw error
            setCountries(data || [])
        } catch (error) {
            console.error('Error fetching countries:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Configuración de Países</h1>
                <Button>Agregar País</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {countries.map((country) => (
                    <Card key={country.code}>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                {country.name}
                                <span className="text-sm font-normal text-gray-500">{country.code}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm mb-1">Moneda: {country.currency}</p>
                            <p className="text-sm mb-1">Idioma: {country.language}</p>
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Configuración Fiscal</h4>
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(country.config, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
