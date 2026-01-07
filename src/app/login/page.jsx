'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Bus, ArrowRight, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { toast } from 'sonner'

export default function LoginPage() {
    const { signIn } = useAuth()
    const [isLoading, setIsLoading] = React.useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.target)
        try {
            await signIn(formData.get('email'), formData.get('password'))
            toast.success('Welcome back to TAMS')
        } catch (err) {
            toast.error(err.message || 'Access Denied')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            
            {/* Subtle Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Login Card */}
            <div className="w-full max-w-md mx-4 md:mt-6 relative z-10">
                <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl ring-1 ring-white/5">
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                            <Bus className="w-7 h-7 text-black" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Sign In</h1>
                        <p className="text-zinc-400 text-sm">Enter your credentials to access the fleet console.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Work Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                                <input 
                                    name="email"
                                    type="email" 
                                    required
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                                <input 
                                    name="password"
                                    type="password" 
                                    required
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-white/5"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Continue to Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="text-center text-[10px] text-zinc-600 mt-8 font-mono uppercase tracking-widest">
                    Secured by TAMS Inc.
                </p>
            </div>
        </div>
    )
}
