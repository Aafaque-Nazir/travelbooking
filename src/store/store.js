import { configureStore } from '@reduxjs/toolkit'
import bookingReducer from './bookingSlice'

export const store = configureStore({
    reducer: {
        booking: bookingReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Disabled for fast prototyping with Date objects if needed, though we use ISO strings
        }),
})
