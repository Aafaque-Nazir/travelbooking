'use client'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { X, User, Phone, MapPin, CreditCard, Send } from 'lucide-react'
import { closeBookingPanel, optimisticUpdateSeatStatus } from '@/store/bookingSlice'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { supabase } from '@/lib/supabase'

export default function ActionPanel({ isMobileExpanded = true, onToggleExpand }) {
    const dispatch = useDispatch()
    const { selectedSeats, isBookingOpen, selectedTrip, selectedDate } = useSelector(state => state.booking)
    
    // Form state
    const [formData, setFormData] = React.useState({
        name: '',
        phone: '',
        gender: 'Male',
        boardingPoint: '',
        amount: 0 // This will be per seat price initially, then calculated as total
    })
    
    // Derived state from Redux (Instant!)
    React.useEffect(() => {
        if (selectedTrip) {
            setFormData(prev => ({
                ...prev,
                amount: selectedTrip.price * (selectedSeats.length || 1),
                boardingPoint: selectedTrip.boardingPoints?.[0] || 'Main Office'
            }))
        }
    }, [selectedTrip, selectedSeats.length])

    const [stats, setStats] = React.useState({ count: 0, revenue: 0, totalSeats: 40 })

    // Fetch Stats only (Prices & Points are already known)
    React.useEffect(() => {
        if (selectedTrip) {
            setStats(prev => ({...prev, totalSeats: selectedTrip.totalSeats || 40}))
            fetchTripStats()
        }
    }, [selectedTrip, selectedDate])

    const fetchTripStats = async () => {
        const dateStr = selectedDate ? selectedDate.split('T')[0] : ''
        const { data } = await supabase
            .from('bookings')
            .select('amount')
            .eq('service_id', selectedTrip.id)
            .eq('travel_date', dateStr)
            .eq('status', 'Booked')
         
        if (data) {
             const revenue = data.reduce((sum, b) => sum + (b.amount || 0), 0)
             setStats(prev => ({ ...prev, count: data.length, revenue }))
        }
    }

    const dateStr = selectedDate ? selectedDate.split('T')[0] : ''

    if (!isBookingOpen || selectedSeats.length === 0) {
        return (
            <div className="h-full flex flex-col bg-muted/5">
                <div className="p-6 border-b border-border bg-white dark:bg-zinc-900">
                    <h2 className="text-lg font-bold tracking-tight">Trip Financials</h2>
                    <p className="text-xs text-muted-foreground mt-1">Real-time overview for {dateStr}</p>
                </div>
                <div className="p-6 space-y-4">
                    <StatCard 
                        label="Total Bookings" 
                        value={`${stats.count} / ${stats.totalSeats}`} 
                        sub={`${Math.round((stats.count / stats.totalSeats) * 100)}% Occupancy`} 
                        color="blue" 
                    />
                    <StatCard 
                        label="Cash Collected" 
                        value={`₹ ${stats.revenue.toLocaleString()}`} 
                        sub="On-seat + Office" 
                        color="emerald" 
                    />
                    <StatCard label="Parcel Revenue" value="₹ 0" sub="Coming Soon" color="amber" />
                </div>
            </div>
        )
    }

    const submitBooking = async (e, status = 'Booked') => {
        if (e) e.preventDefault() // Prevent form submit if event is passed

        // 1. Prepare Payloads for multiple seats
        const bookingPayloads = selectedSeats.map(seat => ({
            trip_id: null, 
            service_id: selectedTrip.id,
            seat_number: seat.seat_number,
            passenger_name: formData.name || 'Blocked Seat', // Default name if blocked
            passenger_phone: formData.phone || '0000000000',
            gender: formData.gender,
            boarding_point: formData.boardingPoint,
            amount: status === 'Blocked' ? 0 : (parseFloat(formData.amount) / selectedSeats.length),
            travel_date: dateStr,
            status: status
        }))

        console.log(`Saving ${status} Bookings:`, bookingPayloads)

        // 2. Batch Insert to Supabase
        const { error } = await supabase.from('bookings').insert(bookingPayloads)

        if (error) {
            console.error("Booking Failed:", error)
            toast.error("Booking Failed: " + error.message)
        } else {
            // 3. Success Updates
            selectedSeats.forEach(seat => {
                dispatch(optimisticUpdateSeatStatus({
                    seatNumber: seat.seat_number,
                    status: status,
                    passengerName: formData.name
                }))
            })
            
            const seatNumbers = selectedSeats.map(s => s.seat_number).join(', ')
            toast.success(`Seats ${seatNumbers} ${status === 'Blocked' ? 'Blocked' : 'Booked'} successfully`)
            
            // 4. WhatsApp Integration (Only for confirmed bookings or if data exists)
            if (formData.phone && status === 'Booked') {
                const message = `*Booking Confirmed!* 🚍%0A` +
                                `*Passenger:* ${formData.name}%0A` +
                                `*Seats:* ${seatNumbers}%0A` +
                                `*Date:* ${dateStr}%0A` +
                                `*Boarding:* ${formData.boardingPoint}%0A` +
                                `*Amount:* ₹${formData.amount}%0A%0A` +
                                `Thank you for traveling with us! 🙏`
                
                const waLink = `https://wa.me/91${formData.phone}?text=${message}`
                window.open(waLink, '_blank')
            }

            dispatch(closeBookingPanel())
            
            // Reset Fields
            setFormData({ name: '', phone: '', gender: 'Male', boardingPoint: 'Main Office', amount: 0 })
            fetchTripStats() // Refresh stats
        }
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-950 shadow-2xl z-20 border-l border-zinc-200 dark:border-zinc-800 lg:rounded-none rounded-t-[2rem]">
            {/* Header: Minimal & informative */}
            <div className="px-6 pb-5 pt-3 lg:pt-5 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col sticky top-0 shrink-0 z-10 transition-colors group">
                
                {/* Mobile Drag Handle / Indicator */}
                <div className="w-full flex justify-center lg:hidden mb-4">
                     {isMobileExpanded ? (
                         <div 
                            className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-800 rounded-full opacity-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(false) }} 
                         />
                     ) : (
                         <div className="flex flex-col items-center gap-1 animate-pulse">
                             <div className="w-10 h-1 bg-primary/50 rounded-full" />
                             <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Tap to Book</span>
                         </div>
                     )}
                </div>
                
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                        <h2 className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                             {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} Selected
                             {!isMobileExpanded && <span className="lg:hidden text-xs bg-primary text-white px-2 py-0.5 rounded-full animate-in fade-in">Continue</span>}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-zinc-400">
                                    {selectedSeats.map(s => s.seat_number).join(', ')}
                                </span>
                                <div className="h-1 w-1 rounded-full bg-zinc-300" />
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    ₹{formData.amount}
                                </span>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            dispatch(closeBookingPanel());
                        }} 
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <form id="booking-form" onSubmit={(e) => submitBooking(e, 'Booked')} className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* 1. Passenger Info */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Passenger Details</h3>
                    
                    {/* Name Input */}
                    <div className="group bg-zinc-50 dark:bg-zinc-900/50 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 rounded-2xl transition-all duration-200">
                        <div className="flex items-center px-4 py-3">
                            <User className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" />
                            <div className="ml-3 flex-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-0.5">Full Name</label>
                                <input 
                                    required
                                    autoFocus
                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:opacity-50 focus:ring-0 focus:outline-none appearance-none"
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Phone Input */}
                    <div className="group bg-zinc-50 dark:bg-zinc-900/50 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 rounded-2xl transition-all duration-200">
                        <div className="flex items-center px-4 py-3">
                            <Phone className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" />
                            <div className="ml-3 flex-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-0.5">Mobile Number</label>
                                <input 
                                    required
                                    type="tel"
                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:opacity-50 focus:ring-0 focus:outline-none appearance-none"
                                    placeholder="98765 43210"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gender Toggle */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                        {['Male', 'Female', 'Other'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({...formData, gender: g})}
                                className={cn(
                                    "py-2 text-xs font-bold rounded-lg transition-all",
                                    formData.gender === g 
                                        ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm scale-[1.02]" 
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Journey Info */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Journey Details</h3>
                    
                    {/* Boarding Point */}
                    <div className="group bg-zinc-50 dark:bg-zinc-900/50 border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 rounded-2xl transition-all duration-200">
                        <div className="flex items-center px-4 py-3">
                            <MapPin className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" />
                            <div className="ml-3 flex-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-0.5">Boarding From</label>
                                <select 
                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                                    value={formData.boardingPoint}
                                    onChange={e => setFormData({...formData, boardingPoint: e.target.value})}
                                >
                                    {(selectedTrip?.boardingPoints || ['Main Office']).map((point, index) => (
                                        <option key={index} value={point} className="bg-white dark:bg-zinc-900">{point}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="group bg-zinc-50 dark:bg-zinc-900/50 border border-transparent focus-within:border-green-500/50 rounded-2xl transition-all duration-200">
                        <div className="flex items-center px-4 py-3">
                            <CreditCard className="h-5 w-5 text-zinc-400 group-focus-within:text-green-600 transition-colors" />
                            <div className="ml-3 flex-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-0.5">Total Amount</label>
                                <div className="flex items-center">
                                    <span className="text-sm font-bold text-zinc-400 mr-1">₹</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-transparent border-none p-0 text-lg font-bold text-zinc-900 dark:text-zinc-100 focus:ring-0 focus:outline-none appearance-none"
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Footer Actions */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 space-y-3 shrink-0">
                <button 
                    type="submit" 
                    form="booking-form"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-sm py-4 rounded-2xl shadow-lg shadow-zinc-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                    <span>Confirm Booking</span>
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button"
                        onClick={() => submitBooking(null, 'Blocked')} 
                        className="py-3 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-500 text-xs font-bold transition-colors"
                    >
                        Block Seat
                    </button>
                    <button onClick={() => dispatch(closeBookingPanel())} className="py-3 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 text-xs font-bold transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, sub, color = "zinc" }) {
    const colorClasses = {
        blue: "bg-blue-50/50 border-blue-100 text-blue-900 dark:bg-blue-900/10 dark:border-blue-900/50 dark:text-blue-100",
        emerald: "bg-emerald-50/50 border-emerald-100 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-900/50 dark:text-emerald-100",
        amber: "bg-amber-50/50 border-amber-100 text-amber-900 dark:bg-amber-900/10 dark:border-amber-900/50 dark:text-amber-100",
        zinc: "bg-card border-border"
    }

    return (
        <div className={cn("p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md", colorClasses[color])}>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            <p className="text-xs font-medium opacity-60 mt-1">{sub}</p>
        </div>
    )
}
