import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client - FAIL LOUDLY if keys are missing
const isConfigured = supabaseUrl && supabaseKey

if (isConfigured) {
    // console.log("✅ Supabase connected") 
} else {
    console.error("❌ CRITICAL: Supabase keys are MISSING! Check your .env.local file.")
}

export const supabase = isConfigured
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ error: { message: "CRITICAL: Supabase keys missing!" } }),
            signUp: async () => ({ error: { message: "CRITICAL: Supabase keys missing!" } }),
            signOut: async () => { },
        },
        from: (table) => ({
            select: () => ({ data: null, error: { message: `Cannot SELECT from '${table}': Supabase not configured!` } }),
            insert: () => ({ error: { message: `Cannot INSERT into '${table}': Supabase not configured!` } }),
            delete: () => ({ error: { message: `Cannot DELETE from '${table}': Supabase not configured!` } }),
            update: () => ({ error: { message: `Cannot UPDATE '${table}': Supabase not configured!` } }),
            order: function () { return this },
            eq: function () { return this },
        })
    }

if (!supabaseUrl || !supabaseKey) {
    console.error("WARNING: Supabase URL or Anon Key is missing. Database features will not work.")
}
