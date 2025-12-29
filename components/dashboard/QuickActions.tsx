import Link from 'next/link'

export default function QuickActions({
    canUpload,
    hasAccountant,
    countryCode
}: {
    canUpload: boolean
    hasAccountant: boolean
    countryCode: string
}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/freelancer/upload">
                <div className={`p-4 rounded-lg border text-center transition-colors ${canUpload
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer'
                        : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}>
                    <span className="text-2xl block mb-2">📄</span>
                    <span className="text-sm font-medium text-blue-900">Subir Factura</span>
                </div>
            </Link>

            <Link href="/dashboard/freelancer/invoices">
                <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-center">
                    <span className="text-2xl block mb-2">list</span>
                    <span className="text-sm font-medium text-gray-700">Ver Facturas</span>
                </div>
            </Link>

            {hasAccountant ? (
                <Link href="/dashboard/freelancer/chat">
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer text-center">
                        <span className="text-2xl block mb-2">💬</span>
                        <span className="text-sm font-medium text-green-900">Chat Contador</span>
                    </div>
                </Link>
            ) : (
                <Link href="/dashboard/freelancer/accountants">
                    <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer text-center">
                        <span className="text-2xl block mb-2">🔍</span>
                        <span className="text-sm font-medium text-purple-900">Buscar Contador</span>
                    </div>
                </Link>
            )}

            <Link href="/dashboard/freelancer/reports">
                <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-center">
                    <span className="text-2xl block mb-2">📊</span>
                    <span className="text-sm font-medium text-gray-700">Reportes</span>
                </div>
            </Link>
        </div>
    )
}
