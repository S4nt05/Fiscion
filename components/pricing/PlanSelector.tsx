'use client'

import { useState } from 'react'
import { usePaddle } from '@/lib/paddle/usePaddle'
import { getPaddlePlans } from '@/lib/paddle/config'

export default function PlanSelector({
    userType,
    countryCode,
    currentPlan,
    userId
}: {
    userType: 'freelancer' | 'accountant'
    countryCode: string
    currentPlan?: string
    userId: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const { paddle, isLoading: paddleLoading, error: paddleError } = usePaddle()

    const plans = {
        freelancer: [
            {
                id: 'basic',
                name: 'Básico',
                price: countryCode === 'NI' ? '$12' : '$14',
                features: ['50 facturas/mes', 'OCR completo', '8 categorías', 'Exportar CSV'],
                paddlePriceId: getPaddlePlans(countryCode, 'freelancer').basic
            },
            {
                id: 'pymes',
                name: 'Pymes',
                price: countryCode === 'NI' ? '$16' : '$18',
                features: ['100 facturas/mes', 'Todo en Básico', '2 Usuarios', 'Soporte Prioritario'],
                paddlePriceId: getPaddlePlans(countryCode, 'freelancer').pymes || '' // Fallback empty if not configured
            },
            {
                id: 'premium',
                name: 'Premium',
                price: countryCode === 'NI' ? '$20' : '$22',
                features: ['200 facturas/mes', 'Todo en Pymes', 'Marketplace contadores', 'Reportes avanzados'],
                paddlePriceId: getPaddlePlans(countryCode, 'freelancer').premium
            }
        ],
        accountant: [
            {
                id: 'pro',
                name: 'Profesional',
                price: countryCode === 'NI' ? '$60' : '$70',
                features: ['Hasta 20 clientes', 'Panel profesional', 'Plantillas personalizables'],
                paddlePriceId: getPaddlePlans(countryCode, 'accountant').pro
            },
            {
                id: 'studio',
                name: 'Estudio',
                price: countryCode === 'NI' ? '$150' : '$180',
                features: ['Hasta 100 clientes', 'Multi-usuario', 'White-label', 'API access'],
                paddlePriceId: getPaddlePlans(countryCode, 'accountant').studio
            }
        ]
    }

    const handleSubscribe = async (planId: string, paddlePriceId: string) => {
        if (!paddle) {
            alert('Paddle no está inicializado. Por favor recarga la página.')
            return
        }

        if (!paddlePriceId) {
            alert('ID de precio no configurado para este plan')
            return
        }

        setIsLoading(true)
        try {
            // Open Paddle checkout overlay
            paddle.Checkout.open({
                items: [
                    {
                        priceId: paddlePriceId,
                        quantity: 1
                    }
                ],
                customData: {
                    userId,
                    userType,
                    countryCode,
                    planType: planId
                },
                // Paddle handles the checkout flow in an overlay
                // Success is handled via webhook (app/api/webhooks/paddle/route.ts)
            })
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Error al abrir el checkout')
        } finally {
            setIsLoading(false)
        }
    }

    const currentPlans = plans[userType]

    // Show loading state while Paddle initializes
    if (paddleLoading) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">Cargando opciones de pago...</p>
            </div>
        )
    }

    // Show error if Paddle failed to load
    if (paddleError) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">Error al cargar el sistema de pagos. Por favor recarga la página.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {currentPlans.map((plan) => (
                <div
                    key={plan.id}
                    className={`border rounded-lg p-6 ${currentPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                >
                    <div className="mb-4">
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="mt-2">
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-gray-600">/mes</span>
                        </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleSubscribe(plan.id, plan.paddlePriceId)}
                        disabled={isLoading || currentPlan === plan.id || !plan.paddlePriceId}
                        className={`w-full py-3 rounded-md font-medium ${currentPlan === plan.id
                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            : !plan.paddlePriceId
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {currentPlan === plan.id ? 'Plan Actual' :
                            !plan.paddlePriceId ? 'No disponible' :
                                isLoading ? 'Procesando...' : 'Seleccionar Plan'}
                    </button>
                </div>
            ))}
        </div>
    )
}
