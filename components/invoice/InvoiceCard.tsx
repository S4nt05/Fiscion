
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface InvoiceCardProps {
    invoice: any
    onView?: (id: string) => void
    onDelete?: (id: string) => void
}

export default function InvoiceCard({ invoice, onView, onDelete }: InvoiceCardProps) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">{invoice.vendor_name || 'Sin nombre'}</h4>
                    <p className="text-sm text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="font-bold">{invoice.currency} {invoice.total_amount?.toFixed(2)}</p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{invoice.status}</span>
                    </div>
                    <div className="flex gap-2">
                        {onView && <Button variant="outline" size="sm" onClick={() => onView(invoice.id)}>Ver</Button>}
                        {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(invoice.id)}>X</Button>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
