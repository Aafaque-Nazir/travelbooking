'use client'
import React from 'react'
import TripSelector from '@/components/dashboard/TripSelector'
import SeatMap from '@/components/dashboard/SeatMap'
import ActionPanel from '@/components/dashboard/ActionPanel'

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Column A: Trip Selector (20%) */}
        <div className="w-1/5 border-r border-border h-full flex flex-col bg-card/50">
            <TripSelector />
        </div>

        {/* Column B: Seat Map (50%) */}
        <div className="w-1/2 h-full bg-muted/20 flex flex-col relative">
            <SeatMap />
        </div>

        {/* Column C: Action Panel (30%) */}
        <div className="w-[30%] border-l border-border h-full bg-card shadow-xl z-10 flex flex-col">
            <ActionPanel />
        </div>
    </div>
  )
}
