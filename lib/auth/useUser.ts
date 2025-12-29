
import { useEffect, useState } from "react"
import { supabase } from "@/lib/database/client"

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)

        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id) // Usar ID en lugar de email es más seguro si la tabla users usa ID como PK vinculada a auth.users
            .single()
          
          // Si no existe en tabla users, usar datos de auth
          setUser(data || session.user)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, session }
}
