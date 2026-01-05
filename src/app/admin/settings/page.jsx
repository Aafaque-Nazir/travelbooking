'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Shield, Activity, UserPlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createAgentAction } from '@/actions/agent-actions'

export default function SettingsPage() {
    const [auditLogs, setAuditLogs] = useState([])
    const [profiles, setProfiles] = useState([])
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20)
        const { data: users } = await supabase.from('profiles').select('*')
        
        if (logs) setAuditLogs(logs)
        if (users) setProfiles(users)
    }

    const handleCreateAgent = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.target)
        
        const result = await createAgentAction(null, formData)
        
        if (result.success) {
            toast.success(result.message)
            setIsAdding(false)
            fetchData()
        } else {
            toast.error(result.message)
            if (result.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                toast.info('Please add the Service Role Key to your .env.local file.', { duration: 5000 })
            }
        }
        setIsSubmitting(false)
    }

    return (
        <div className="space-y-8 relative">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                <p className="text-zinc-400">Manage users and audit activity.</p>
            </div>

            {/* Modal Overlay */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Add New Agent</h3>
                            <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateAgent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Full Name</label>
                                <input name="fullName" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Email Address</label>
                                <input name="email" type="email" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="agent@tams.inc" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Password</label>
                                <input name="password" type="password" required minLength={6} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" />
                            </div>
                            
                            <div className="pt-2">
                                <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                    {isSubmitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Management */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white">Team Members</h3>
                        </div>
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-500 transition-colors"
                        >
                            <UserPlus className="w-3 h-3" /> Add Agent
                        </button>
                    </div>

                    <div className="space-y-3">
                        {profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                        {(profile.role && profile.role[0]) ? profile.role[0].toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{profile.full_name || 'Unknown User'}</div>
                                        <div className="text-xs text-zinc-500">ID: {profile.id.substring(0,8)}...</div>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded bg-zinc-900 border ${profile.role === 'admin' ? 'text-amber-400 border-amber-400/20' : 'text-zinc-400 border-zinc-700'}`}>
                                    {(profile.role || 'agent').toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white">Recent Activity</h3>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {auditLogs.length === 0 ? (
                            <p className="text-sm text-zinc-500 text-center py-4">No activity recorded yet.</p>
                        ) : auditLogs.map(log => (
                            <div key={log.id} className="flex gap-3 text-sm border-b border-white/5 last:border-0 pb-3 last:pb-0">
                                <span className="text-zinc-500 font-mono text-xs mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</span>
                                <div>
                                    <span className="text-white font-medium block">{log.action}</span>
                                    <span className="text-zinc-500 text-xs block">{JSON.stringify(log.details)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
