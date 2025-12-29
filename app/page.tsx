import Link from 'next/link'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold text-blue-900">FISCION</h1>
                <div className="flex gap-4">
                    <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Iniciar Sesión
                    </Link>
                    <Link href="/dashboard/freelancer" className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                        Dashboard
                    </Link>
                </div>
            </div>

            <div className="mt-12 text-center">
                <h2 className="text-2xl font-semibold mb-4">Gestión Fiscal Simplificada</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Para freelancers y contadores en Nicaragua y Centroamérica.
                    Automatiza tus declaraciones, gestiona facturas y conecta con expertos.
                </p>
            </div>
        </main>
    )
}
