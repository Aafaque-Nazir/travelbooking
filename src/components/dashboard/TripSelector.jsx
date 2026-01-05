'use client'
import React from 'react'
import { Calendar, ChevronRight, Bus, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedDate, setSelectedTripId } from '@/store/bookingSlice'
import { useAuth } from '@/context/AuthProvider'
import { format } from 'date-fns'

export default function TripSelector() {
    const dispatch = useDispatch()
    const { signOut } = useAuth()
    const { selectedDate, selectedTripId } = useSelector(state => state.booking)

    // Set default date on client-side to avoid hydration mismatch
    React.useEffect(() => {
        if (!selectedDate) {
            dispatch(setSelectedDate(new Date().toISOString()))
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
            const dateStr = selectedDate.split('T')[0] // YYYY-MM-DD
            
            // 1. Get all Master Services
            const { data: services, error } = await supabase
                .from('master_services')
                .select(`
                    *,
                    buses (id, name, type, total_seats, seat_layout_type),
                    routes (source_city, destination_city)
                `)
                .eq('is_active', true)
                .order('departure_time', { ascending: true })

            if (error) throw error
            // Handle empty services gracefully
            if (!services) {
                setTrips([])
                return
            }

            // 2. Get Bookings Count
            const servicesWithAvailability = await Promise.all(services.map(async (service) => {
                const { count } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('service_id', service.id)
                    .eq('travel_date', dateStr)
                    .eq('status', 'Booked')

                return {
                    id: service.id,
                    // SHOW BUS NAME so user can find "Sigma Trip"
                    name: `${service.buses.name} (${service.routes.source_city} ➝ ${service.routes.destination_city})`, 
                    time: service.departure_time.slice(0, 5),
                    seatsLeft: service.buses.total_seats - (count || 0),
                    totalSeats: service.buses.total_seats,
                    type: service.buses.type,
                    price: service.price,
                    layout: service.buses.seat_layout_type
                }
            }))

            setTrips(servicesWithAvailability)
            
            if (servicesWithAvailability.length > 0 && !selectedTripId) {
                dispatch(setSelectedTripId(servicesWithAvailability[0].id))
            }
        } catch (err) {
            console.error("Fetch Error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/5">
            <div className="p-6 border-b border-border bg-white dark:bg-zinc-900 shadow-sm z-10">
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
                        onChange={(e) => dispatch(setSelectedDate(new Date(e.target.value).toISOString()))}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase tracking-wide cursor-pointer"
                    />
                    <Calendar className="absolute right-4 top-3.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between px-2 pb-2">
                    <span className="text-xs font-medium text-muted-foreground">Available Trips</span>
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-zinc-500">{trips.length} Found</span>
                </div>
                
                {isLoading && <div className="text-center py-10 text-zinc-400 text-sm">Loading schedules...</div>}

                {!isLoading && trips.length === 0 && (
                    <div className="text-center py-10 text-zinc-400 text-sm border-2 border-dashed border-zinc-800 rounded-xl">
                        No buses scheduled needed.
                    </div>
                )}

                {trips.map(trip => {
                    const isSelected = selectedTripId === trip.id
                    return (
                    <button
                        key={trip.id}
                        onClick={() => dispatch(setSelectedTripId(trip.id))}
                        className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                            isSelected 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]" 
                            : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-primary/50 hover:shadow-md"
                        )}
                    >
                        {/* Decorative background visual for selected state */}
                        {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />}

                        <div className="flex justify-between items-start mb-3 relative z-10 gap-2">
                            <div>
                                <span className="font-bold text-base block truncate w-[120px]">{trip.name}</span>
                                <span className={cn("text-[10px] uppercase tracking-wider font-medium opacity-70", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                    {trip.type}
                                </span>
                            </div>
                            <span className={cn("text-sm font-mono font-bold whitespace-nowrap", isSelected ? "opacity-100" : "opacity-80")}>
                                {trip.time}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs relative z-10 w-full">
                             <div className={cn("flex items-center gap-1.5", isSelected ? "opacity-90" : "text-muted-foreground")}>
                                <Bus className="h-3.5 w-3.5" />
                                <span>{trip.price} / seat</span>
                             </div>
                             
                             <div className={cn(
                                "px-2 py-1 rounded-md font-bold text-[10px] uppercase tracking-wide flex items-center gap-1",
                                isSelected ? "bg-white/20 text-white" : 
                                trip.seatsLeft > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                trip.seatsLeft > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                             )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                                    trip.seatsLeft > 0 ? "bg-current" : "bg-transparent"
                                )} />
                                {trip.seatsLeft === 0 ? 'FULL' : `${trip.seatsLeft} LEFT`}
                             </div>
                        </div>
                    </button>
                    )
                })}
            </div>
        </div>
    )
}
