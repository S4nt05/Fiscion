import { redirect } from 'next/navigation'
import { createClient } from '@/lib/database/server'


export default async function DashboardPage() {
    const supabase = createClient()

    // Check auth user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to get user_type
    const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

    // Route based on user_type
    if (profile?.user_type === 'freelancer') {
        redirect('/dashboard/freelancer')
    }

    if (profile?.user_type === 'accountant') {
        redirect('/dashboard/accountant')
    }

    // Safety fallback: If we are here but have no role, go to onboarding
    redirect('/onboarding/select-role')
}
