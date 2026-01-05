import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    selectedDate: null,
    selectedTrip: null, // Full trip object { id, name, price, bus: {...}, route: {...} }
    selectedSeats: [], // Array of seat objects { seat_number: '1', status: 'Available' }
    seats: [],
    isBookingOpen: false,
}

export const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload
            state.selectedSeats = [] // clear selection on date change
            state.isBookingOpen = false
            // Keep selectedTrip if valid, or clear it? Better to clear to force re-selection or re-validation
            state.selectedTrip = null
        },
        setSelectedTrip: (state, action) => {
            state.selectedTrip = action.payload // Now storing full object
            state.selectedSeats = [] // clear selection on trip change
            state.isBookingOpen = false
        },
        toggleSeat: (state, action) => {
            const seat = action.payload
            const existsIndex = state.selectedSeats.findIndex(s => s.seat_number === seat.seat_number)

            if (existsIndex >= 0) {
                // Remove if already selected
                state.selectedSeats.splice(existsIndex, 1)
            } else {
                // Add if not selected
                state.selectedSeats.push(seat)
            }

            // Open panel if we have at least one seat
            state.isBookingOpen = state.selectedSeats.length > 0
        },
        clearSelection: (state) => {
            state.selectedSeats = []
            state.isBookingOpen = false
        },
        setSeats: (state, action) => {
            state.seats = action.payload
        },
        closeBookingPanel: (state) => {
            state.isBookingOpen = false
            state.selectedSeats = []
        },
        // Optimistic updates
        optimisticUpdateSeatStatus: (state, action) => {
            const { seatNumber, status, passengerName } = action.payload
            const seatIndex = state.seats.findIndex(s => s.seat_number === seatNumber)
            if (seatIndex !== -1) {
                state.seats[seatIndex] = {
                    ...state.seats[seatIndex],
                    status,
                    passenger_name: passengerName
                }
            }
        }
    },
})

export const { setSelectedDate, setSelectedTrip, toggleSeat, clearSelection, setSeats, closeBookingPanel, optimisticUpdateSeatStatus } = bookingSlice.actions

export default bookingSlice.reducer
