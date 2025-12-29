import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/paddle/checkout
 * 
 * Creates a Paddle checkout session for subscription purchases
 * This endpoint prepares the checkout data that will be used by Paddle.js on the frontend
 */
export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userType, countryCode, planType } = await request.json()

    // Validate required fields
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId and userId' },
        { status: 400 }
      )
    }

    // Return checkout configuration
    // The actual checkout will be opened by Paddle.js on the frontend
    const checkoutConfig = {
      items: [
        {
          priceId: priceId,
          quantity: 1
        }
      ],
      customData: {
        userId,
        userType,
        countryCode,
        planType
      },
      customer: {
        // Can be pre-filled if user data is available
      }
    }

    return NextResponse.json({
      success: true,
      checkoutConfig
    })
  } catch (error: any) {
    console.error('Paddle Checkout Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    )
  }
}
