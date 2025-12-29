
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log('Mock Email:', { to, subject, html })
    return { success: true, id: 'mock-id' }
  }

  try {
    const data = await resend.emails.send({
      from: 'Fiscion <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}
