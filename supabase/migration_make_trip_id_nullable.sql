-- Make trip_id nullable since we now use service_id for daily trips
ALTER TABLE public.bookings ALTER COLUMN trip_id DROP NOT NULL;

-- Optional: Add constraint to ensure EITHER trip_id OR (service_id AND travel_date) is present
-- ALTER TABLE public.bookings ADD CONSTRAINT bookings_link_check CHECK (
--   (trip_id IS NOT NULL) OR (service_id IS NOT NULL AND travel_date IS NOT NULL)
-- );
