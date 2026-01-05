'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bus, Map, Calendar, DollarSign, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalBuses: 0,
        totalRoutes: 0,
        activeTrips: 0,
        revenue: 0
    })

    useEffect(() => {
        const fetchStats = async () => {
            // In a real app, you might have a dedicated RPC or stats table.
            // For now, we'll just count rows.
            const { count: busCount } = await supabase.from('buses').select('*', { count: 'exact', head: true })
            const { count: routeCount } = await supabase.from('routes').select('*', { count: 'exact', head: true })
            const { count: tripCount } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'Scheduled')
            
            setStats({
                totalBuses: busCount || 0,
                totalRoutes: routeCount || 0,
                activeTrips: tripCount || 0,
                revenue: 12450 // Mocked for now until bookings are real
            })
        }
        fetchStats()
    }, [])

    const statCards = [
        { label: 'Total Fleet', value: stats.totalBuses, icon: Bus, color: 'bg-blue-500/10 text-blue-400' },
        { label: 'Active Routes', value: stats.totalRoutes, icon: Map, color: 'bg-emerald-500/10 text-emerald-400' },
        { label: 'Scheduled Trips', value: stats.activeTrips, icon: Calendar, color: 'bg-violet-500/10 text-violet-400' },
        { label: 'Today Revenue', value: '₹' + stats.revenue.toLocaleString(), icon: DollarSign, color: 'bg-amber-500/10 text-amber-400' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-zinc-400">Welcome back, Admin. Here is what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`p-3 rounded-xl ${stat.color}`}>
                                    <Icon className="w-6 h-6" />
                                </span>
                                <TrendingUp className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions Placeholder */}
                <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl h-64 flex items-center justify-center border-dashed">
                    <p className="text-zinc-500">Revenue Chart (Coming Soon)</p>
                </div>
                <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl h-64 flex items-center justify-center border-dashed">
                    <p className="text-zinc-500">Recent Activity (Coming Soon)</p>
                </div>
            </div>
        </div>
    )
}
