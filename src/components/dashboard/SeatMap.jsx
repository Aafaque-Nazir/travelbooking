'use client'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSeat } from '@/store/bookingSlice'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function SeatMap() {
    const dispatch = useDispatch()
    const { selectedTripId, selectedSeats, seats, selectedDate } = useSelector(state => state.booking)

    // Load REAL data when trip is selected
    React.useEffect(() => {
        if (selectedTripId && selectedDate) {
            fetchSeatData()
        }
    }, [selectedTripId, selectedDate])

    const fetchSeatData = async () => {
        const dateStr = selectedDate.split('T')[0]

        // 1. Fetch Service Details (to know total seats)
        const { data: service, error: svcError } = await supabase
            .from('master_services')
            .select('*, buses(total_seats, seat_layout_type)')
            .eq('id', selectedTripId)
            .single()

        if (svcError || !service) return

        // 2. Fetch Booked Seats for this date
        const { data: bookedSeats, error: bkError } = await supabase
            .from('bookings')
            .select('seat_number, passenger_name, gender')
            .eq('service_id', selectedTripId)
            .eq('travel_date', dateStr)
            .eq('status', 'Booked')

        const bookedMap = new Map()
        bookedSeats?.forEach(b => bookedMap.set(b.seat_number, b))

        // 3. Generate Grid based on Bus Capacity
        const totalSeats = service.buses.total_seats || 40
        const generatedSeats = Array.from({ length: totalSeats }, (_, i) => {
            const seatNum = `${i + 1}`
            const booking = bookedMap.get(seatNum)
            return {
                seat_number: seatNum,
                status: booking ? 'Booked' : 'Available',
                passenger_name: booking?.passenger_name || null,
                gender: booking?.gender || null
            }
        })

        dispatch({ type: 'booking/setSeats', payload: generatedSeats })
    }

    const displaySeats = seats && seats.length > 0 ? seats : []

    const handleSeatClick = (seat) => {
        dispatch(toggleSeat(seat))
    }

    if (!selectedTripId) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95">
                <p>Select a trip to view seat map</p>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 flex justify-center bg-muted/10">
            <div className="w-[320px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border-4 border-zinc-200 dark:border-zinc-800 p-6 relative min-h-[600px]">
                {/* Windshield / Driver Area */}
                <div className="w-full h-24 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-t-[2.5rem] absolute top-0 left-0 border-b border-zinc-100 dark:border-zinc-800" />
                
                <div className="relative z-10 w-full mb-10 flex items-end justify-between px-4 pb-4 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground/50 rotate-90 origin-left translate-y-[-20px]">CABIN</span>
                    <div className="w-10 h-10 rounded-full border-4 border-zinc-400 dark:border-zinc-700 flex items-center justify-center shadow-inner bg-zinc-100 dark:bg-zinc-800">
                         {/* Steering Wheel Icon Representation */}
                         <div className="w-6 h-6 rounded-full border-2 border-zinc-500 relative">
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-500 -translate-y-1/2" />
                            <div className="absolute top-1/2 left-1/2 w-[2px] h-1/2 bg-zinc-500 -translate-x-1/2 -translate-y-[0px]" />
                         </div>
                    </div>
                </div>

                {/* Seats Grid */}
                <div className="grid grid-cols-5 gap-y-6 gap-x-2 px-2 pb-10"> 
                     {displaySeats.map((seat, i) => {
                        const colInRow = i % 4
                        return (
                            <React.Fragment key={seat.seat_number}>
                                {colInRow === 2 && <div className="w-6" />} {/* Aisle */}
                                <Seat 
                                    seat={seat} 
                                    isSelected={selectedSeats.some(s => s.seat_number === seat.seat_number)}
                                    onClick={() => handleSeatClick(seat)}
                                />
                            </React.Fragment>
                        )
                     })}
                </div>
            </div>
        </div>
    )
}

function Seat({ seat, isSelected, onClick }) {
    // Status colors
    const getStatusClass = (status) => {
        if (isSelected) return "bg-green-600 border-green-600 text-white shadow-green-900/20 shadow-lg transform scale-105"
        switch (status) {
            case 'Booked': return "bg-red-100 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 cursor-not-allowed opacity-80"
            case 'Blocked': return "bg-yellow-100 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-400"
            default: return "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-primary hover:shadow-md hover:-translate-y-0.5"
        }
    }

    return (
        <button
            onClick={() => status !== 'Booked' && onClick(seat)}
            disabled={seat.status === 'Booked'}
            className={cn(
                "w-10 h-10 m-0.5 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 relative group",
                getStatusClass(seat.status)
            )}
        >
            {seat.seat_number}
            {/* Mock Headrest */}
            <div className={cn("absolute -top-1.5 w-8 h-1.5 rounded-full opacity-50", 
                 seat.status === 'Booked' ? 'bg-red-300 dark:bg-red-900' : 
                 isSelected ? 'bg-green-400' : 'bg-zinc-200 dark:bg-zinc-700'
            )} />

            {/* Hover tooltip */}
            {seat.status === 'Booked' && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-zinc-900 text-zinc-50 text-[10px] px-2 py-1 rounded shadow-xl">
                    {seat.passenger_name || 'Passenger'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                </div>
            )}
        </button>
    )
}
