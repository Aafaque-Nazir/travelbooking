'use client'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { X, User, Phone, MapPin, CreditCard, Send } from 'lucide-react'
import { closeBookingPanel, optimisticUpdateSeatStatus } from '@/store/bookingSlice'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { supabase } from '@/lib/supabase'

export default function ActionPanel() {
    const dispatch = useDispatch()
    const { selectedSeats, isBookingOpen, selectedTripId, selectedDate } = useSelector(state => state.booking)
    
    // Form state
    const [formData, setFormData] = React.useState({
        name: '',
        phone: '',
        gender: 'Male',
        boardingPoint: '',
        amount: 0 // This will be per seat price initially, then calculated as total
    })
    
    const [boardingPoints, setBoardingPoints] = React.useState([])
    const [isLoadingData, setIsLoadingData] = React.useState(false)
    const [stats, setStats] = React.useState({ count: 0, revenue: 0, totalSeats: 40 })

    // Fetch Trip Details (Price & Boarding Points) & Real-time Stats
    React.useEffect(() => {
        if (selectedTripId) {
            fetchTripDetails()
            fetchTripStats()
        }
    }, [selectedTripId, selectedDate])

    // Update total amount when seats change
    const unitPrice = React.useRef(0)
    React.useEffect(() => {
        if (unitPrice.current > 0) {
            setFormData(prev => ({ 
                ...prev, 
                amount: unitPrice.current * selectedSeats.length 
            }))
        }
    }, [selectedSeats.length])

    const fetchTripDetails = async () => {
        setIsLoadingData(true)
        const { data } = await supabase
            .from('master_services')
            .select(`
                price,
                buses (total_seats),
                routes (boarding_points)
            `)
            .eq('id', selectedTripId)
            .single()
        
        if (data) {
            unitPrice.current = data.price
            setFormData(prev => ({
                ...prev,
                amount: data.price * selectedSeats.length,
                boardingPoint: data.routes?.boarding_points?.[0] || 'Main Office'
            }))
            setBoardingPoints(data.routes?.boarding_points || ['Main Office'])
            setStats(prev => ({...prev, totalSeats: data.buses?.total_seats || 40}))
        }
        setIsLoadingData(false)
    }

    const fetchTripStats = async () => {
        const dateStr = selectedDate ? selectedDate.split('T')[0] : ''
        const { data } = await supabase
            .from('bookings')
            .select('amount')
            .eq('service_id', selectedTripId)
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

    const handleBooking = async (e) => {
        e.preventDefault()

        // 1. Prepare Payloads for multiple seats
        const bookingPayloads = selectedSeats.map(seat => ({
            trip_id: null, // Legacy field, keeping null
            service_id: selectedTripId,
            seat_number: seat.seat_number,
            passenger_name: formData.name,
            passenger_phone: formData.phone,
            gender: formData.gender,
            boarding_point: formData.boardingPoint,
            amount: parseFloat(formData.amount) / selectedSeats.length, // Split total amount per seat
            travel_date: dateStr,
            status: 'Booked'
        }))

        console.log("Saving Bookings:", bookingPayloads)

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
                    status: 'Booked',
                    passengerName: formData.name
                }))
            })
            
            const seatNumbers = selectedSeats.map(s => s.seat_number).join(', ')
            toast.success(`Seats ${seatNumbers} booked for ${formData.name}`)
            
            // 4. WhatsApp Integration
            const message = `*Booking Confirmed!* 🚍%0A` +
                            `*Passenger:* ${formData.name}%0A` +
                            `*Seats:* ${seatNumbers}%0A` +
                            `*Date:* ${dateStr}%0A` +
                            `*Boarding:* ${formData.boardingPoint}%0A` +
                            `*Amount:* ₹${formData.amount}%0A%0A` +
                            `Thank you for traveling with us! 🙏`
            
            const waLink = `https://wa.me/91${formData.phone}?text=${message}`
            window.open(waLink, '_blank')

            dispatch(closeBookingPanel())
            
            // Reset Fields
            setFormData({ name: '', phone: '', gender: 'Male', boardingPoint: 'Main Office', amount: 0 })
            fetchTripStats() // Refresh stats
        }
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900 shadow-2xl z-20">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-zinc-900 text-white sticky top-0 shrink-0">
                <div>
                   <h2 className="font-bold text-lg flex items-center gap-2">
                        Booking {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-normal">
                             {selectedSeats.map(s => s.seat_number).join(', ')}
                        </span>
                   </h2>
                   <p className="text-xs opacity-70 mt-0.5">{dateStr}</p>
                </div>
                <button onClick={() => dispatch(closeBookingPanel())} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Form */}
            <form id="booking-form" onSubmit={handleBooking} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 ml-1">
                            <User className="h-3.5 w-3.5" /> Passenger Name
                        </label>
                        <input 
                            required
                            autoFocus
                            className="w-full bg-muted/20 border-2 border-muted hover:border-muted-foreground/30 focus:border-primary focus:bg-white dark:focus:bg-zinc-950 rounded-xl p-3 text-sm transition-all outline-none font-medium"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 ml-1">
                                <Phone className="h-3.5 w-3.5" /> Mobile
                            </label>
                            <input 
                                required
                                type="tel"
                                className="w-full bg-muted/20 border-2 border-muted hover:border-muted-foreground/30 focus:border-primary focus:bg-white dark:focus:bg-zinc-950 rounded-xl p-3 text-sm transition-all outline-none font-medium"
                                placeholder="98765..."
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5 w-1/3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide ml-1">Gender</label>
                            <select 
                                className="w-full bg-muted/20 border-2 border-muted hover:border-muted-foreground/30 focus:border-primary focus:bg-white dark:focus:bg-zinc-950 rounded-xl p-3 text-sm transition-all outline-none font-medium appearance-none"
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                            >
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 ml-1">
                            <MapPin className="h-3.5 w-3.5" /> Boarding Point
                        </label>
                        <select 
                            className="w-full bg-muted/20 border-2 border-muted hover:border-muted-foreground/30 focus:border-primary focus:bg-white dark:focus:bg-zinc-950 rounded-xl p-3 text-sm transition-all outline-none font-medium"
                            value={formData.boardingPoint}
                            onChange={e => setFormData({...formData, boardingPoint: e.target.value})}
                            disabled={isLoadingData}
                        >
                            {boardingPoints.map((point, index) => (
                                <option key={index} value={point}>{point}</option>
                            ))}
                            {boardingPoints.length === 0 && <option>Main Office</option>}
                        </select>
                    </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 ml-1">
                            <CreditCard className="h-3.5 w-3.5" /> Amount (₹)
                        </label>
                        <input 
                            type="number"
                            className="w-full bg-green-50/50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 focus:border-green-500 rounded-xl p-3 text-lg font-mono font-bold text-green-700 dark:text-green-400 outline-none transition-all"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                </div>
            </form>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-muted/10 space-y-4 shrink-0">
                <button 
                    type="submit" 
                    form="booking-form"
                    className="w-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-base py-4 rounded-xl shadow-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <span>Confirm Booking</span>
                    {/* Enter Key hint */}
                    <kbd className="hidden md:inline-flex h-6 items-center gap-1 rounded border border-white/20 bg-white/10 px-2 font-mono text-[10px] font-medium text-white opacity-80">
                        <span className="text-xs">RET</span>
                    </kbd>
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 px-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-500 text-sm font-bold transition-colors">
                        Block Seat
                    </button>
                    <button className="py-3 px-3 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-800 dark:text-red-500 text-sm font-bold transition-colors">
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
