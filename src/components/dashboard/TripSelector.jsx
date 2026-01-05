'use client'
import React from 'react'
import { Calendar, ChevronRight, Bus, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedDate, setSelectedTrip } from '@/store/bookingSlice'
import { useAuth } from '@/context/AuthProvider'
import { format } from 'date-fns'

export default function TripSelector() {
    const dispatch = useDispatch()
    const { signOut } = useAuth()
    const { selectedDate, selectedTrip } = useSelector(state => state.booking)
    // Legacy ID constraint (until full migration)
    const selectedTripId = selectedTrip?.id

    // Set default date on client-side to avoid hydration mismatch and ensure Local Time
    React.useEffect(() => {
        if (!selectedDate) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const localDate = `${year}-${month}-${day}`;
            dispatch(setSelectedDate(localDate))
        }
    }, [selectedDate, dispatch])

    const [trips, setTrips] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(false)

    // Fetch Daily Services (Trips) whenever Date changes
    React.useEffect(() => {
        if (selectedDate) {
            fetchDailyServices()
        }
    }, [selectedDate])

    const fetchDailyServices = async () => {
        try {
            setIsLoading(true)
            const dateStr = selectedDate.split('T')[0]
            
            // 1. Parallel Fetch: Services + All Bookings for Date
            const [servicesRes, bookingsRes] = await Promise.all([
                supabase
                    .from('master_services')
                    .select(`
                        *,
                        buses (id, name, type, total_seats, seat_layout_type),
                        routes (source_city, destination_city, boarding_points, dropping_points)
                    `)
                    .eq('is_active', true)
                    .order('departure_time', { ascending: true }),
                
                supabase
                    .from('bookings')
                    .select('service_id')
                    .eq('travel_date', dateStr)
                    .eq('status', 'Booked')
            ])

            if (servicesRes.error) throw servicesRes.error
            const services = servicesRes.data || []
            const allBookings = bookingsRes.data || []

            // 2. Map booking counts in memory (Fast!)
            const bookingCounts = {}
            allBookings.forEach(b => {
                bookingCounts[b.service_id] = (bookingCounts[b.service_id] || 0) + 1
            })

            // 3. Construct Trip Objects
            const tripsData = services.map(service => {
                const bookedCount = bookingCounts[service.id] || 0
                return {
                    id: service.id,
                    // Specific fields for grouping
                    busName: service.buses.name,
                    busType: service.buses.type,
                    source: service.routes.source_city,
                    dest: service.routes.destination_city,
                    groupId: service.buses.id, // Group by Bus Only (Unified Folder)
                    
                    time: service.departure_time.slice(0, 5),
                    seatsLeft: (service.buses.total_seats || 40) - bookedCount,
                    totalSeats: service.buses.total_seats || 40,
                    price: service.price,
                    layout: service.buses.seat_layout_type,
                    boardingPoints: service.routes.boarding_points,
                    droppingPoints: service.routes.dropping_points,
                    busId: service.buses.id
                }
            })

            setTrips(tripsData)
            
            // Auto Select logic
            if (tripsData.length > 0 && !selectedTripId) {
                dispatch(setSelectedTrip(tripsData[0]))
            }
        } catch (err) {
            console.error("Fetch Error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    // Grouping Logic
    const groupedTrips = React.useMemo(() => {
        const groups = {}
        trips.forEach(trip => {
            if (!groups[trip.groupId]) {
                groups[trip.groupId] = {
                    key: trip.groupId,
                    busName: trip.busName,
                    busType: trip.busType,
                    // source/dest removed from group level as it may vary within group
                    services: []
                }
            }
            groups[trip.groupId].services.push(trip)
        })
        return Object.values(groups)
    }, [trips])

    const [isListExpanded, setIsListExpanded] = React.useState(true)

    // Helper to toggle list
    const handleSelectTrip = (trip) => {
        dispatch(setSelectedTrip(trip))
        setIsListExpanded(false) // Collapse list on selection to show map
    };

    // Auto-collapse if trip is already selected on mount (e.g. default)
    React.useEffect(() => {
        if (selectedTrip) setIsListExpanded(false)
    }, [])

    return (
        <div className="flex flex-col h-full bg-muted/5">
            <div className="p-6 border-b border-border bg-white dark:bg-zinc-900 shadow-sm z-10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Travel Date</h2>
                     <button 
                        onClick={signOut}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md" 
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
                <div className="relative group">
                    <input 
                        type="date" 
                        value={selectedDate ? selectedDate.split('T')[0] : ''} 
                        onChange={(e) => dispatch(setSelectedDate(e.target.value))}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase tracking-wide cursor-pointer"
                    />
                    <Calendar className="absolute right-4 top-3.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
                </div>
            </div>
            
            {/* Collapsed State (Active Trip Summary) */}
            {!isListExpanded && selectedTrip && (
                 <div className="p-4 bg-primary/5 border-b border-primary/10 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <div>
                             <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Current Selection</p>
                             <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                                <Bus className="h-4 w-4" />
                                {selectedTrip.busName}
                             </div>
                             <p className="text-xs text-muted-foreground mt-0.5">{selectedTrip.time} • {selectedTrip.source} ➝ {selectedTrip.dest}</p>
                        </div>
                        <button 
                            onClick={() => setIsListExpanded(true)}
                            className="text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shadow-sm hover:bg-zinc-50 transition-colors"
                        >
                            Change
                        </button>
                    </div>
                </div>
            )}

            {/* Expanded List State */}
            {isListExpanded && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-2 pb-2">
                        <span className="text-xs font-medium text-muted-foreground">Available Services</span>
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-zinc-500">{trips.length} Trips</span>
                    </div>
                    
                    {isLoading && <div className="text-center py-10 text-zinc-400 text-sm">Loading schedules...</div>}

                    {!isLoading && trips.length === 0 && (
                        <div className="text-center py-10 text-zinc-400 text-sm border-2 border-dashed border-zinc-800 rounded-xl">
                            No buses scheduled needed.
                        </div>
                    )}

                    {/* Grouped Display - Unified Folders */}
                    {groupedTrips.map(group => (
                        <div key={group.key} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                            {/* Group Header - Generic Bus Info */}
                            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                                        <Bus className="h-4 w-4 text-primary" />
                                        {group.busName}
                                    </h3>
                                    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500">
                                        {group.busType}
                                    </span>
                                </div>
                            </div>

                            {/* Services List - Specific Route Info */}
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {group.services.map(trip => {
                                    const isSelected = selectedTripId === trip.id
                                    return (
                                        <button
                                            key={trip.id}
                                            onClick={() => handleSelectTrip(trip)}
                                            className={cn(
                                                "w-full text-left p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group relative",
                                                isSelected ? "bg-primary/5 dark:bg-primary/10" : ""
                                            )}
                                        >
                                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                            
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-sm group-hover:text-primary transition-colors">
                                                        {trip.time}
                                                    </span>
                                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                        {trip.source} ➝ {trip.dest}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-xs font-medium">₹{trip.price}</div>
                                                <div className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                    trip.seatsLeft > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                                                     : "bg-red-100 text-red-700"
                                                )}>
                                                    {trip.seatsLeft} L
                                                </div>
                                                <ChevronRight className={cn(
                                                    "w-4 h-4 text-muted-foreground/30 transition-transform",
                                                    isSelected ? "translate-x-1 text-primary" : ""
                                                )} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
