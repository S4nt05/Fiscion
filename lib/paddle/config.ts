/**
 * Paddle Configuration
 * Maps plan types to Paddle Price IDs for different countries
 */

export const getPaddlePlans = (countryCode: string, userType: 'freelancer' | 'accountant') => {
  // Price IDs should be created in Paddle Dashboard
  // These come from environment variables for security
  const plans: any = {
    NI: {
      freelancer: {
        basic: process.env.PADDLE_PRICE_NI_FREELANCER_BASIC || '',
        premium: process.env.PADDLE_PRICE_NI_FREELANCER_PREMIUM || ''
      },
      accountant: {
        pro: process.env.PADDLE_PRICE_NI_ACCOUNTANT_PRO || '',
        studio: process.env.PADDLE_PRICE_NI_ACCOUNTANT_STUDIO || ''
      }
    },
    CR: {
      freelancer: {
        basic: process.env.PADDLE_PRICE_CR_FREELANCER_BASIC || '',
        premium: process.env.PADDLE_PRICE_CR_FREELANCER_PREMIUM || ''
      },
      accountant: {
        pro: process.env.PADDLE_PRICE_CR_ACCOUNTANT_PRO || '',
        studio: process.env.PADDLE_PRICE_CR_ACCOUNTANT_STUDIO || ''
      }
    },
    // Default fallback
    default: {
      freelancer: {
        basic: process.env.PADDLE_PRICE_DEFAULT_FREELANCER_BASIC || '',
        premium: process.env.PADDLE_PRICE_DEFAULT_FREELANCER_PREMIUM || ''
      },
      accountant: {
        pro: process.env.PADDLE_PRICE_DEFAULT_ACCOUNTANT_PRO || '',
        studio: process.env.PADDLE_PRICE_DEFAULT_ACCOUNTANT_STUDIO || ''
      }
    }
  }
  
  return plans[countryCode]?.[userType] || plans['default'][userType]
}

/**
 * Get Paddle environment (sandbox or production)
 */
export const getPaddleEnvironment = (): 'sandbox' | 'production' => {
  return (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
}

/**
 * Get Paddle client token for frontend
 */
export const getPaddleClientToken = (): string => {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
  if (!token) {
    throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not defined')
  }
  return token
}
