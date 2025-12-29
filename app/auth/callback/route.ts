import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error) {
    console.error('Auth Error from Provider:', error, error_description)
    return NextResponse.redirect(`${origin}/login?error=${error}&description=${error_description}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )
      
    const { error: sessionError, data: { session } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!sessionError && session?.user) {
        // Sync assigned_accountant from metadata to public profile if needed
        const assignedId = session.user.user_metadata?.assigned_accountant_id
        if (assignedId) {
            await supabase.from('users').update({ assigned_accountant_id: assignedId }).eq('id', session.user.id)
        }
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth Session Exchange Error:', sessionError)
    // If invalid grant/refresh token, force logout potentially?
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code_provided`)
}
