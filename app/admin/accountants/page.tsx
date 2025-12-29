
import { Metadata } from 'next'
import AccountantManager from '@/components/admin/AccountantManager'

export const metadata: Metadata = {
    title: 'Gestión de Contadores | Admin Fiscion',
}

export default function AccountantsPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Directorio de Contadores</h1>
            <AccountantManager />
        </div>
    )
}
