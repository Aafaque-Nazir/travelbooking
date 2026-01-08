'use client'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSeat } from '@/store/bookingSlice'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function SeatMap() {
    const dispatch = useDispatch()
    const { selectedTrip, selectedSeats, seats, selectedDate } = useSelector(state => state.booking)
    const [isLoading, setIsLoading] = React.useState(false)

    // Load REAL data when trip is selected
    React.useEffect(() => {
        if (selectedTrip && selectedDate) {
            console.log("🔄 Trip Changed:", selectedTrip.id, selectedTrip.busName)
            // Clear previous seats to prevent ghosting
            dispatch({ type: 'booking/setSeats', payload: [] }) 
            dispatch({ type: 'booking/clearSelection' })
            fetchSeatData()
        }
    }, [selectedTrip?.id, selectedDate]) // Depend on ID specifically to ensure trigger

    const fetchSeatData = async () => {
        if (!selectedTrip?.id) return

        setIsLoading(true)
        const dateStr = selectedDate.split('T')[0]

        console.log("🔍 Fetching bookings for:", selectedTrip.id, dateStr)

        // 2. Fetch Booked Seats for this date
        const { data: bookedSeats, error: bkError } = await supabase
            .from('bookings')
            .select('seat_number, passenger_name, gender')
            .eq('service_id', selectedTrip.id)
            .eq('travel_date', dateStr)
            .eq('status', 'Booked')

        if (bkError) {
             console.error("❌ Error fetching bookings:", bkError)
             setIsLoading(false)
             return
        }

        console.log("✅ Bookings Found:", bookedSeats?.length || 0)

        const bookedMap = new Map()
        bookedSeats?.forEach(b => bookedMap.set(b.seat_number, b))

        // 3. Generate Grid based on Cached Capacity (Fast!)
        const totalSeats = selectedTrip.totalSeats || 40
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
        setIsLoading(false)
    }

    const displaySeats = seats && seats.length > 0 ? seats : []

    const handleSeatClick = (seat) => {
        dispatch(toggleSeat(seat))
    }

    if (!selectedTrip) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95">
                <p>Select a trip to view seat map</p>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto p-4 lg:p-8 flex justify-center bg-muted/10 pb-32 lg:pb-8">
            <div className="w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border-4 border-zinc-200 dark:border-zinc-800 p-6 relative min-h-[600px] shrink-0 transform scale-90 sm:scale-100 origin-top">
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
                {/* Dynamic Seats Grid */}
                {(() => {
                    const layoutType = selectedTrip.layout || '2+2 Seater'
                    const is2x1 = layoutType.includes('2+1')
                    const isSleeper = layoutType.toLowerCase().includes('sleeper')
                    
                    if (is2x1) {
                        // 2+1 Layout with "Single on Left, Double on Right"
                        // Logic: Seats 1,2 (Right), Seat 3 (Left, Shifted Back 1 row to align with 4,5)
                        // Last Row: 4 Seats (fills aisle)
                        
                        const rows = []
                        const totalSeats = selectedTrip.totalSeats || 30
                        
                        // Last 4 seats go to the back row
                        const lastRowSeatsCount = 4
                        const regularSeats = totalSeats - lastRowSeatsCount
                        
                        // Calculate number of regular rows needed
                        // Each block of 3 seats (2 Right, 1 Left) takes 1 row, but Left is shifted
                        // Seat 1,2 -> Row 0. Seat 3 -> Row 1.
                        // Seat 4,5 -> Row 1. Seat 6 -> Row 2.
                        // So alignment is: Right i, Left i-1.
                        const lastRegularRowIndex = Math.ceil(regularSeats / 3) 
                        
                        // Initialize Grid
                        // We need enough rows. Last row will be at lastRegularRowIndex + maybe 1 spacer?
                        // Let's just create rows dynamically.

                        // Map Booking Objects
                        const seatMap = new Map()
                        displaySeats.forEach(s => seatMap.set(parseInt(s.seat_number), s))

                        // Populate Grid
                        for (let i = 1; i <= totalSeats; i++) {
                            let r, c

                            if (i > regularSeats) {
                                // LAST ROW LOGIC (21, 22, 23, 24)
                                // They should fill the row: [Left, Aisle, Inner, Window]
                                r = lastRegularRowIndex + 1 // Place at the very end
                                
                                // Map last 4 seats to columns 0, 1, 2, 3
                                // 21 -> 0, 22 -> 1, 23 -> 2, 24 -> 3
                                // Formula: i - regularSeats - 1
                                c = i - regularSeats - 1
                            } else {
                                // REGULAR ROW LOGIC
                                // 1, 2 -> Row 0 (Right)
                                // 3    -> Row 1 (Left) - Aligned with 4,5
                                // 4, 5 -> Row 1 (Right)
                                
                                const block = Math.ceil(i / 3) - 1
                                const rem = i % 3
                                
                                if (rem === 1) { // Seat 1, 4... (NOW Left/Inner of pair)
                                    r = block
                                    c = 2
                                } else if (rem === 2) { // Seat 2, 5... (NOW Right/Window of pair)
                                    r = block
                                    c = 3
                                } else { // Seat 3, 6... (Left Single) -> Shifted to align with NEXT block of right seats?
                                    // Wait, User wanted "3 ko ek seat piche".
                                    // If 1,2 are Row 0. 4,5 are Row 1.
                                    // Seat 3 (Left) matches 1,2 physically in block count, but we want it in Row 1.
                                    r = block + 1
                                    c = 0
                                }
                            }

                            if (!rows[r]) {
                                rows[r] = [null, null, null, null]
                            }
                            rows[r][c] = seatMap.get(i)
                        }

                         // Fill any empty gaps in rows array (if any jumped)
                         for(let k=0; k<rows.length; k++) {
                            if(!rows[k]) rows[k] = [null, null, null, null]
                         }

                        return (
                            <div className="flex flex-col gap-4 px-4 pb-10">
                                {rows.map((row, rIndex) => (
                                    <div key={rIndex} className="grid grid-cols-4 gap-x-4 w-full max-w-[280px] mx-auto">
                                        {/* Col 0: Left Window */}
                                        <div className="flex justify-center">
                                            {row[0] && (
                                                <Seat 
                                                    seat={row[0]} 
                                                    isSleeper={isSleeper}
                                                    isSelected={selectedSeats.some(s => s.seat_number === row[0].seat_number)}
                                                    onClick={() => handleSeatClick(row[0])}
                                                />
                                            )}
                                        </div>

                                        {/* Col 1: Aisle / Center Seat */}
                                        <div className="flex justify-center">
                                            {row[1] && (
                                                <Seat 
                                                    seat={row[1]} 
                                                    isSleeper={isSleeper}
                                                    isSelected={selectedSeats.some(s => s.seat_number === row[1].seat_number)}
                                                    onClick={() => handleSeatClick(row[1])}
                                                />
                                            )}
                                        </div>

                                        {/* Col 2: Right Inner */}
                                        <div className="flex justify-center">
                                            {row[2] && (
                                                <Seat 
                                                    seat={row[2]} 
                                                    isSleeper={isSleeper}
                                                    isSelected={selectedSeats.some(s => s.seat_number === row[2].seat_number)}
                                                    onClick={() => handleSeatClick(row[2])}
                                                />
                                            )}
                                        </div>

                                        {/* Col 3: Right Window */}
                                        <div className="flex justify-center">
                                            {row[3] && (
                                                <Seat 
                                                    seat={row[3]} 
                                                    isSleeper={isSleeper}
                                                    isSelected={selectedSeats.some(s => s.seat_number === row[3].seat_number)}
                                                    onClick={() => handleSeatClick(row[3])}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )

                    } else {
                        // Standard 2+2 Layout
                        return (
                            <div className="grid grid-cols-5 gap-y-6 gap-x-2 px-2 pb-10 max-w-[280px] mx-auto"> 
                                {displaySeats.map((seat, i) => {
                                    const indexInRow = i % 4
                                    const isAisle = indexInRow === 1 // [S][S] [A] [S][S]

                                    return (
                                        <React.Fragment key={seat.seat_number}>
                                            <Seat 
                                                seat={seat} 
                                                isSleeper={isSleeper}
                                                isSelected={selectedSeats.some(s => s.seat_number === seat.seat_number)}
                                                onClick={() => handleSeatClick(seat)}
                                            />
                                            {/* Render Aisle Spacer */}
                                            {isAisle && <div className="w-6" />} 
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        )
                    }
                })()}
            </div>
        </div>
    )
}

function Seat({ seat, isSelected, isSleeper, onClick }) {
    // Status colors
    const getStatusClass = (status) => {
        if (isSelected) return "bg-green-600 border-green-600 text-white shadow-green-900/20 shadow-lg transform scale-105"
        switch (status) {
            case 'Booked': return "bg-red-500/20 border-red-500/50 text-red-500 cursor-not-allowed opacity-80"
            case 'Blocked': return "bg-yellow-500/20 border-yellow-500/50 text-yellow-500"
            // AVAILABLE: Lighter grey/white for better visibility
            default: return "bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-zinc-200 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 hover:bg-indigo-50 dark:hover:bg-zinc-600"
        }
    }

    return (
        <button
            onClick={() => status !== 'Booked' && onClick(seat)}
            disabled={seat.status === 'Booked'}
            className={cn(
                "rounded-lg border flex items-center justify-center text-xs font-bold transition-all duration-200 relative group shadow-sm",
                isSleeper ? "w-10 h-20" : "w-10 h-10", 
                getStatusClass(seat.status)
            )}
        >
            {seat.seat_number}
            {/* Pillow / Accents */}
            <div className={cn(
                "absolute rounded-full opacity-40",
                isSleeper ? "top-2 right-2 w-3 h-6" : "-top-1.5 w-6 h-1", 
                seat.status === 'Booked' ? 'bg-red-500' : 
                isSelected ? 'bg-green-200' : 'bg-zinc-400 dark:bg-zinc-400'
            )} />

            {/* Hover tooltip */}
            {seat.status === 'Booked' && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-zinc-900 text-zinc-50 text-[10px] px-2 py-1 rounded shadow-xl">
                    {seat.passenger_name || 'Booked'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                </div>
            )}
        </button>
    )
}
