"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Bus, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const { signIn } = useAuth()
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        
        const formData = new FormData(e.target)
        const email = formData.get('email')
        const password = formData.get('password')

        try {
            await signIn(email, password)
            toast.success('Welcome back!')
            // Redirect handled by AuthProvider
        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to sign in')
            toast.error('Login Failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl ring-1 ring-white/10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                            <Bus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight text-center">
                            Welcome Back
                        </h1>
                        <p className="text-zinc-400 text-sm mt-2 text-center">
                            Travel Agency Management System
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input 
                                    name="email"
                                    type="email" 
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                                    placeholder="operator@tams.inc"
                                    defaultValue="demo@tams.inc"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input 
                                    name="password"
                                    type="password" 
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                                    defaultValue="password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer hover:text-zinc-300">
                                <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium">Forgot password?</a>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In to Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-zinc-500">
                             Authorized Personnel Only
                        </p>
                    </div>
                </div>
                
                <p className="text-center text-[10px] text-zinc-600 mt-8 font-mono">
                    v1.0.2 • TAMS Secure Environment
                </p>
            </div>
        </div>
    )
}
