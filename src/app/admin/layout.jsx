'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bus, Map, Calendar, Settings, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'

export default function AdminLayout({ children }) {
    const pathname = usePathname()
    const { signOut } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
        { icon: Bus, label: 'Fleet Management', href: '/admin/buses' },
        { icon: Map, label: 'Routes', href: '/admin/routes' },
        { icon: Calendar, label: 'Schedule Trips', href: '/admin/trips' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ]

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-900 border-b border-white/5 p-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Bus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm tracking-tight">TAMS Admin</h1>
                    </div>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar (Responsive) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-white/5 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 hidden lg:block">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">TAMS Admin</h1>
                            <p className="text-xs text-zinc-500">Fleet Console</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 mt-16 lg:mt-0 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' 
                                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 bg-zinc-900">
                    <button 
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-zinc-950 pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
