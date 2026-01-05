'use server'

import { createClient } from '@supabase/supabase-js'

export async function createAgentAction(prevState, formData) {
    const email = formData.get('email')
    const password = formData.get('password')
    const fullName = formData.get('fullName')

    // 1. Check for Service Role Key
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
            success: false,
            message: 'CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. Cannot create users securely.'
        }
    }

    // 2. Create User in Supabase Auth
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the agent
        user_metadata: { full_name: fullName }
    })

    if (createError) {
        return { success: false, message: createError.message }
    }

    // 3. Force Role to 'agent' (Fixing potential trigger default)
    // We wait 500ms to ensure Trigger usually runs first, then we overwrite
    // Or we can just upsert.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: user.id,
            role: 'agent',
            full_name: fullName
        })

    if (profileError) {
        return { success: false, message: 'User created but Profile update failed: ' + profileError.message }
    }

    // 4. Log this action (Audit)
    await supabaseAdmin.from('audit_logs').insert({
        action: 'CREATE_AGENT',
        details: { agent_email: email, agent_name: fullName },
        // We can't easily get the 'current admin ID' in a server action without passing it or checking cookies.
        // For simplicity, we'll leave user_id null or pass it from client if needed. 
        // But better to verify auth on server.
    })

    return { success: true, message: 'Agent created successfully!' }
}
