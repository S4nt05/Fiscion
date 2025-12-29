
import { Metadata } from 'next'
import AccountantManager from '@/components/admin/AccountantManager'

export const metadata: Metadata = {
    title: 'Admin Dashboard | Fiscion',
    description: 'Panel de administración de Fiscion',
}

export default function AdminPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-semibold text-lg mb-2">Usuarios Totales</h3>
                    <p className="text-3xl font-bold">--</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-semibold text-lg mb-2">Facturas Procesadas</h3>
                    <p className="text-3xl font-bold">--</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                    <h3 className="font-semibold text-lg mb-2">Ingresos Mensuales</h3>
                    <p className="text-3xl font-bold">--</p>
                </div>
            </div>

            <AccountantManager />
        </div>
    )
}
