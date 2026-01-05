'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import TripSelector from '@/components/dashboard/TripSelector'
import SeatMap from '@/components/dashboard/SeatMap'
import ActionPanel from '@/components/dashboard/ActionPanel'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { isBookingOpen, selectedSeats } = useSelector(state => state.booking)
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = React.useState(false) // Default collapsed
  
  // Mobile: Show ActionPanel layout only if booking is active
  const showMobileActionPanel = isBookingOpen && selectedSeats.length > 0

  // Reset expansion state when panel is closed/hidden
  React.useEffect(() => {
      if (!showMobileActionPanel) {
          setIsMobilePanelExpanded(false)
      }
  }, [showMobileActionPanel])

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background overflow-hidden relative">
        
        {/* Column A: Trip Selector */}
        {/* Mobile: Top Header Area. Desktop: Left Sidebar */}
        <div className="w-full lg:w-[22%] border-b lg:border-b-0 lg:border-r border-border h-auto lg:h-full flex flex-col bg-card/50 shrink-0 z-20">
            <TripSelector />
        </div>

        {/* Column B: Seat Map */}
        {/* Mobile: Fills Remaining Space. Desktop: Center */}
        <div className="flex-1 w-full lg:w-[48%] bg-muted/20 relative overflow-hidden flex flex-col">
            <SeatMap />
        </div>

        {/* Column C: Action Panel */}
        {/* Mobile: Bottom Sheet (Conditional). Desktop: Right Sidebar */}
        <div 
            onClick={() => !isMobilePanelExpanded && setIsMobilePanelExpanded(true)}
            className={cn(
            "fixed inset-x-0 bottom-0 z-50 lg:static lg:z-auto bg-card border-t lg:border-t-0 lg:border-l border-border shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out flex flex-col",
            "lg:w-[30%] lg:h-full lg:translate-y-0", // Desktop: Standard
            // Mobile States
            !showMobileActionPanel && "h-0 translate-y-full lg:h-full", 
            showMobileActionPanel && !isMobilePanelExpanded && "h-[90px] translate-y-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900", // Summary Mode
            showMobileActionPanel && isMobilePanelExpanded && "h-[85vh] translate-y-0" // Expanded Mode
        )}>
           {/* We pass props relative to mobile state */}
           <ActionPanel 
                isMobileExpanded={isMobilePanelExpanded} 
                onToggleExpand={setIsMobilePanelExpanded} 
           />
        </div>
        
        {/* Mobile Overlay for Focus (Only when expanded) */}
        {showMobileActionPanel && isMobilePanelExpanded && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
                onClick={() => setIsMobilePanelExpanded(false)}
            />
        )}
    </div>
  )
}
