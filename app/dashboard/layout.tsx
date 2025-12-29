import DashboardHeader from '@/components/dashboard/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <main>
                {children}
            </main>
        </div>
    )
}
