
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ReportGenerator() {
    const [reportType, setReportType] = useState('monthly')
    const [generating, setGenerating] = useState(false)

    const handleGenerate = async () => {
        setGenerating(true)
        // Simulación de generación de reporte
        await new Promise(resolve => setTimeout(resolve, 2000))
        setGenerating(false)
        alert('Reporte generado (simulado)')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generador de Reportes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Reporte</label>
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="annual">Anual</SelectItem>
                            <SelectItem value="tax">Impuestos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={generating}
                >
                    {generating ? 'Generando...' : 'Descargar Reporte'}
                </Button>
            </CardContent>
        </Card>
    )
}
