import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/database/server'
import { Database } from '@/types/database.types'
import crypto from 'crypto'

/**
 * SECURITY: Verify Paddle webhook signature
 * This prevents unauthorized webhook calls and ensures data integrity
 * 
 * @param rawBody - Raw request body as string
 * @param signature - Paddle-Signature header value
 * @returns boolean indicating if signature is valid
 */
function verifyPaddleSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    console.error('Missing Paddle-Signature header')
    return false
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET not configured')
    return false
  }

  try {
    // Parse signature components
    // Paddle signature format: "ts=timestamp;h1=signature"
    const parts = signature.split(';')
    const timestamp = parts.find(p => p.startsWith('ts='))?.split('=')[1]
    const signatureHash = parts.find(p => p.startsWith('h1='))?.split('=')[1]

    if (!timestamp || !signatureHash) {
      console.error('Invalid signature format')
      return false
    }

    // SECURITY: Check timestamp to prevent replay attacks (5 minute window)
    const currentTime = Math.floor(Date.now() / 1000)
    const signatureTime = parseInt(timestamp, 10)
    const timeDifference = Math.abs(currentTime - signatureTime)
    
    if (timeDifference > 300) { // 5 minutes
      console.error('Signature timestamp too old, possible replay attack')
      return false
    }

    // Verify signature
    const signedPayload = `${timestamp}:${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * POST /api/webhooks/paddle
 * 
 * SECURITY FEATURES:
 * - Signature verification to prevent unauthorized requests
 * - Timestamp validation to prevent replay attacks
 * - Timing-safe comparison to prevent timing attacks
 * - Environment-based webhook secret
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('Paddle-Signature')

    // SECURITY: Verify webhook signature before processing
    if (!verifyPaddleSignature(rawBody, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the verified payload
    const event = JSON.parse(rawBody)
    const eventType = event.event_type

    console.log(`Processing Paddle webhook: ${eventType}`)

    const supabase = createClient()

    // Handle different event types
    switch (eventType) {
      case 'transaction.completed':
        await handleTransactionCompleted(event, supabase)
        break

      case 'subscription.created':
        await handleSubscriptionCreated(event, supabase)
        break

      case 'subscription.updated':
        await handleSubscriptionUpdated(event, supabase)
        break

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event, supabase)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle transaction.completed event
 * Creates or updates subscription when payment is successful
 */
async function handleTransactionCompleted(
  event: any,
  supabase: ReturnType<typeof createClient>
) {
  const transaction = event.data
  const customData = transaction.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    console.error('No userId in transaction custom_data')
    return
  }

  // Extract subscription info
  const subscriptionId = transaction.subscription_id
  const priceId = transaction.items?.[0]?.price_id
  const planType = customData.planType || 'basic'

  // Create or update subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      paddle_subscription_id: subscriptionId,
      paddle_price_id: priceId,
      paddle_transaction_id: transaction.id,
      plan_type: planType,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }, {
      onConflict: 'paddle_subscription_id'
    })

  if (subError) {
    console.error('Error creating subscription:', subError)
    return
  }

  // Update user limits based on plan
  const limits = getPlanLimits(planType)
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_plan: planType,
      invoice_limit: limits.invoiceLimit,
      paddle_customer_id: transaction.customer_id
    })
    .eq('id', userId)

  if (userError) {
    console.error('Error updating user:', userError)
  }
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(
  event: any,
  supabase: ReturnType<typeof createClient>
) {
  const subscription = event.data
  const customData = subscription.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    console.error('No userId in subscription custom_data')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      paddle_subscription_id: subscription.id,
      paddle_price_id: subscription.items?.[0]?.price_id,
      plan_type: customData.planType || 'basic',
      status: subscription.status,
      current_period_start: subscription.current_billing_period?.starts_at,
      current_period_end: subscription.current_billing_period?.ends_at
    })

  if (error) {
    console.error('Error creating subscription:', error)
  }
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(
  event: any,
  supabase: ReturnType<typeof createClient>
) {
  const subscription = event.data

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: subscription.current_billing_period?.starts_at,
      current_period_end: subscription.current_billing_period?.ends_at,
      cancel_at_period_end: subscription.scheduled_change?.action === 'cancel'
    })
    .eq('paddle_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

/**
 * Handle subscription.canceled event
 */
async function handleSubscriptionCanceled(
  event: any,
  supabase: ReturnType<typeof createClient>
) {
  const subscription = event.data

  // Update subscription status
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled'
    })
    .eq('paddle_subscription_id', subscription.id)

  if (subError) {
    console.error('Error canceling subscription:', subError)
    return
  }

  // Downgrade user to free plan
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('paddle_subscription_id', subscription.id)
    .single()

  if (subData?.user_id) {
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_plan: 'free',
        invoice_limit: 10 // Free plan limit
      })
      .eq('id', subData.user_id)

    if (userError) {
      console.error('Error downgrading user:', userError)
    }
  }
}

/**
 * Get plan limits based on plan type
 */
function getPlanLimits(planType: string): { invoiceLimit: number } {
  const limits: Record<string, { invoiceLimit: number }> = {
    free: { invoiceLimit: 10 },
    basic: { invoiceLimit: 50 },
    premium: { invoiceLimit: 200 },
    pro: { invoiceLimit: 500 },
    studio: { invoiceLimit: 2000 }
  }

  return limits[planType] || limits.free
}
