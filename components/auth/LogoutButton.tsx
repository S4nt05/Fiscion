'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogout = async () => {
        setLoading(true)
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
        setLoading(false)
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="text-gray-600 hover:text-red-600 font-medium px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
        >
            {loading ? 'Saliendo...' : 'Cerrar Sesión'}
        </button>
    )
}
