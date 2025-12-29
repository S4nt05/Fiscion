
// import Stripe from 'stripe'

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
//   apiVersion: '2023-10-16',
//   typescript: true,
// })

// export async function createCheckoutSession(priceId: string, userId: string) {
//   return stripe.checkout.sessions.create({
//     mode: 'subscription',
//     payment_method_types: ['card'],
//     line_items: [{ price: priceId, quantity: 1 }],
//     success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
//     cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
//     metadata: { userId },
//   })
// }
