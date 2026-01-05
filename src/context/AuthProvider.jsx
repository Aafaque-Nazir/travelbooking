'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
             const { data: { session } } = await supabase.auth.getSession()
             if (session?.user) {
                 await fetchRoleAndRedirect(session.user)
             } else {
                 setUser(null)
                 setLoading(false)
             }
        }
        
        checkSession()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchRoleAndRedirect(session.user)
            } else if (_event === 'SIGNED_OUT') {
                setUser(null)
                setLoading(false)
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const fetchRoleAndRedirect = async (currentUser) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single()
        
        const role = profile?.role || 'agent'
        setUser({ ...currentUser, role })
        setLoading(false)

        const currentPath = window.location.pathname
        
        // Admin Force Redirect
        if (role === 'admin') {
            if (currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/' || currentPath === '/signup') {
                router.push('/admin')
            }
        } 
        // Agent Force Redirect
        else {
            if (currentPath.startsWith('/admin') || currentPath === '/login' || currentPath === '/' || currentPath === '/signup') {
                router.push('/dashboard')
            }
        }
    }

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
