'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import FreelancerEditor from '@/components/profile/FreelancerEditor'
import AccountantEditor from '@/components/profile/AccountantEditor'
import TeamManager from '@/components/profile/TeamManager'

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [countries, setCountries] = useState<any[]>([])

    // Form State
    const [fullName, setFullName] = useState('')
    const [countryCode, setCountryCode] = useState('')
    const [userType, setUserType] = useState('')
    const [profileData, setProfileData] = useState<any>({})

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function loadData() {
            // Load Countries
            const { data: countriesData } = await supabase
                .from('countries')
                .select('code, name, currency, config')
                .order('name')

            if (countriesData) setCountries(countriesData)

            // Load User Profile
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (profile) {
                    setUser(profile)
                    setFullName(profile.full_name || '')
                    setCountryCode(profile.country_code || '')
                    setUserType(profile.user_type || '')
                    setProfileData(profile.profile_data || {})
                }
            }
            setLoading(false)
        }
        loadData()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('users')
            .update({
                full_name: fullName,
                country_code: countryCode,
                // user_type is NOT updated here, it's fixed
                profile_data: profileData,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (error) {
            alert('Error updating profile')
        } else {
            alert('Profile updated successfully!')
            router.refresh()
        }
        setSaving(false)
    }

    if (loading) return <div className="p-8">Loading profile...</div>

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center space-x-4 mb-6">
                    {user?.image ? (
                        <img src={user.image} alt="Profile" className="w-20 h-20 rounded-full" />
                    ) : (
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                            👤
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold">{user?.email}</h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 uppercase ${userType === 'freelancer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {userType || 'Unassigned'}
                        </span>
                    </div>
                </div>

                <div className="space-y-6 max-w-lg">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fiscal Residence
                        </label>
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Country...</option>
                            {countries.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Specialized Editors */}
                    {userType === 'freelancer' && (
                        <FreelancerEditor
                            data={profileData}
                            onChange={setProfileData}
                            labels={countries.find(c => c.code === countryCode)?.config}
                        />
                    )}

                    {userType === 'accountant' && (
                        <AccountantEditor data={profileData} onChange={setProfileData} />
                    )}

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Subscription Section (Preserved) */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Subscription & Plans</h3>
                <div className="flex justify-between items-center mb-6">
                    <p>Current Plan: <span className="font-semibold uppercase text-blue-600">{user?.subscription_plan || 'Free'}</span></p>
                    <a href="/pricing" className="text-blue-600 hover:underline font-medium">
                        Manage Subscription →
                    </a>
                </div>

                {user?.subscription_plan && user.subscription_plan !== 'free' && (
                    <div className="border-t pt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h4>
                        <p className="text-sm text-gray-500 mb-4">
                            If you cancel, you will lose access to premium features at the end of your billing period.
                        </p>
                        <button
                            onClick={async () => {
                                if (confirm('Are you sure you want to cancel your subscription?')) {
                                    const { error } = await supabase
                                        .from('users')
                                        .update({ subscription_plan: 'free' })
                                        .eq('id', user.id)

                                    if (error) alert('Error cancelling subscription')
                                    else {
                                        alert('Subscription cancelled. You are now on the Free plan.')
                                        window.location.reload()
                                    }
                                }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 hover:bg-red-50 px-4 py-2 rounded-md transition-colors"
                        >
                            Cancelar Suscripción
                        </button>
                    </div>
                )}

                {/* Team Management */}
                {(user?.subscription_plan === 'pymes' || user?.subscription_plan === 'premium') && (
                    <TeamManager limit={user.subscription_plan === 'pymes' ? 2 : 5} ownerId={user.id} />
                )}
            </div>
        </div>
    )
}
