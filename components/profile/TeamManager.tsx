'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TeamManager({ limit, ownerId }: { limit: number, ownerId: string }) {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        loadMembers()
    }, [])

    const loadMembers = async () => {
        const { data } = await supabase
            .from('team_members')
            .select('*')
            .eq('owner_id', ownerId)

        if (data) setMembers(data)
        setLoading(false)
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (members.length >= limit) {
            alert(`Plan limit reached (${limit} members). Upgrade to add more.`)
            return
        }

        setInviting(true)
        try {
            const { error } = await supabase
                .from('team_members')
                .insert({
                    owner_id: ownerId,
                    email: inviteEmail,
                    role: 'viewer', // Default
                    status: 'pending'
                })

            if (error) throw error

            setInviteEmail('')
            loadMembers()
            alert('Invitation sent! (Simulation)')
        } catch (error: any) {
            console.error('Invite error:', error)
            alert('Error sending invite: ' + error.message)
        } finally {
            setInviting(false)
        }
    }

    const handleRemove = async (id: string) => {
        if (!confirm('Remove this member?')) return

        await supabase.from('team_members').delete().eq('id', id)
        loadMembers()
    }

    if (loading) return <div>Loading team...</div>

    return (
        <div className="mt-8 border-t pt-8">
            <h3 className="text-xl font-bold mb-4">Team Management</h3>
            <p className="text-gray-600 mb-4">
                You have used {members.length} of {limit} seats available in your plan.
            </p>

            {/* Invite Form */}
            {members.length < limit && (
                <form onSubmit={handleInvite} className="flex gap-4 mb-6">
                    <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        className="flex-1 border rounded-md px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={inviting}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        {inviting ? 'Inviting...' : 'Invite'}
                    </button>
                </form>
            )}

            {/* Members List */}
            <div className="space-y-3">
                {members.map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <div>
                            <p className="font-medium">{m.email}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {m.status}
                            </span>
                        </div>
                        <button
                            onClick={() => handleRemove(m.id)}
                            className="text-red-600 text-sm hover:underline"
                        >
                            Remove
                        </button>
                    </div>
                ))}

                {members.length === 0 && (
                    <p className="text-gray-500 italic text-sm">No team members yet.</p>
                )}
            </div>
        </div>
    )
}
