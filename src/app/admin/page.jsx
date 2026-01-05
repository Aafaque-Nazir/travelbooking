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
            try {
                // 1. Get Counts
                const { count: busCount } = await supabase.from('buses').select('id', { count: 'exact', head: true })
                const { count: routeCount } = await supabase.from('routes').select('id', { count: 'exact', head: true })
                // Use master_services for "Active Trips" as that's the schedule
                const { count: tripCount } = await supabase.from('master_services').select('id', { count: 'exact', head: true }).eq('is_active', true)
                
                // 2. Calculate Revenue (Real)
                const { data: bookings } = await supabase.from('bookings').select('amount').eq('status', 'Booked')
                const totalRevenue = bookings ? bookings.reduce((sum, b) => sum + (b.amount || 0), 0) : 0

                setStats({
                    totalBuses: busCount || 0,
                    totalRoutes: routeCount || 0,
                    activeTrips: tripCount || 0,
                    revenue: totalRevenue
                })
            } catch (error) {
                console.error("Stats Fetch Error:", error)
            }
        }
        fetchStats()
    }, [])

    const statCards = [
        { label: 'Total Fleet', value: stats.totalBuses, icon: Bus, color: 'bg-blue-500/10 text-blue-400' },
        { label: 'Active Routes', value: stats.totalRoutes, icon: Map, color: 'bg-emerald-500/10 text-emerald-400' },
        { label: 'Scheduled Services', value: stats.activeTrips, icon: Calendar, color: 'bg-violet-500/10 text-violet-400' },
        { label: 'Total Revenue', value: '₹' + stats.revenue.toLocaleString(), icon: DollarSign, color: 'bg-amber-500/10 text-amber-400' },
    ]

    return (
        <div className="space-y-6 md:space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-sm md:text-base text-zinc-400">Welcome back, Admin. Real-time fleet activity.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="p-4 md:p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`p-3 rounded-xl ${stat.color}`}>
                                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                                </span>
                                <TrendingUp className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl md:text-3xl font-bold text-white">{stat.value}</h3>
                                <p className="text-xs md:text-sm font-medium text-zinc-500">{stat.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                {/* Revenue Chart Placeholder */}
                <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl h-48 md:h-64 flex flex-col items-center justify-center border-dashed text-center">
                    <p className="text-zinc-500 font-medium">Revenue Trends</p>
                    <span className="text-xs text-zinc-600 mt-2">Visualizations coming soon</span>
                </div>
                {/* Recent Activity Placeholder */}
                <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl h-48 md:h-64 flex flex-col items-center justify-center border-dashed text-center">
                    <p className="text-zinc-500 font-medium">System Health</p>
                    <span className="text-xs text-zinc-600 mt-2">All systems operational</span>
                </div>
            </div>
        </div>
    )
}
