'use client'

import { useState } from 'react'
import { useUser } from '@/lib/auth/useUser'
import PlanSelector from '@/components/pricing/PlanSelector'

export default function PricingPage() {
    const { user } = useUser()
    const [userType, setUserType] = useState<'freelancer' | 'accountant'>('freelancer')

    // Si el usuario ya está logueado, usar su tipo y país
    // Si no, usar defaults
    const countryCode = user?.country_code || 'NI'
    const currentPlan = user?.subscription_plan

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Planes y Precios</h1>
                <p className="text-xl text-gray-600">
                    Elige el plan perfecto para gestionar tus impuestos en {countryCode === 'NI' ? 'Nicaragua' : 'tu país'}.
                </p>

                {!user && (
                    <div className="mt-6 flex justify-center space-x-4">
                        <button
                            onClick={() => setUserType('freelancer')}
                            className={`px-4 py-2 rounded-full ${userType === 'freelancer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                        >
                            Freelancers
                        </button>
                        <button
                            onClick={() => setUserType('accountant')}
                            className={`px-4 py-2 rounded-full ${userType === 'accountant' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                        >
                            Contadores
                        </button>
                    </div>
                )}
            </div>

            <PlanSelector
                userType={user?.user_type || userType}
                countryCode={countryCode}
                currentPlan={currentPlan}
                userId={user?.id || 'guest'}
            />
        </div>
    )
}
