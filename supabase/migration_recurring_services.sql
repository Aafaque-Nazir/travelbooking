-- 1. Create Master Services Table (The "Template")
CREATE TABLE IF NOT EXISTS public.master_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE,
    route_id uuid REFERENCES public.routes(id) ON DELETE CASCADE,
    departure_time time not null, -- e.g. '21:00:00'
    duration text, -- e.g. '5h 30m' (Display purpose)
    price numeric not null,
    is_active boolean default true
);

-- 2. Update Bookings to support Date-Based Logic
-- Instead of linking to a specific "Trip ID", we link to "Service ID" + "Travel Date".
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.master_services(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travel_date date;

-- 3. RLS for Master Services
ALTER TABLE public.master_services DISABLE ROW LEVEL SECURITY; -- Keep it simple for now as requested
