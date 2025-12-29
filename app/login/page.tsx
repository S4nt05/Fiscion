
'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/database/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    // Fix hydration error by ensuring Auth renders only on client
    const [mounted, setMounted] = useState(false)
    const router = useRouter() // Import from next/navigation

    useEffect(() => {
        setMounted(true)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                router.refresh() // Ensure middleware runs
                router.push('/dashboard')
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    // ... existing mounted check ...
    if (!mounted) return null

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
                <Auth
                    supabaseClient={supabase as any}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                    showLinks={false}
                    view="sign_in"
                />

                <div className="mt-4 text-center text-sm">
                    <p className="text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <a href="/register" className="text-blue-600 hover:underline font-medium">
                            Regístrate aquí
                        </a>
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        <a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon") }} className="hover:text-gray-700">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
