-- Fix Delete Issue: Update Foreign Key Constraints to CASCADE

-- 1. Disable RLS on all tables temporarily
ALTER TABLE public.buses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- 2. Update Trip → Bus foreign key to CASCADE delete
-- When a bus is deleted, all its trips will also be deleted automatically
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_bus_id_fkey;
ALTER TABLE public.trips ADD CONSTRAINT trips_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE;

-- 3. Update Booking → Trip foreign key to CASCADE delete
-- When a trip is deleted, all its bookings will be deleted too
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_trip_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;

-- 4. Update Trip → Route foreign key to CASCADE delete
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_route_id_fkey;
ALTER TABLE public.trips ADD CONSTRAINT trips_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;
