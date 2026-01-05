-- Force RLS to be disabled for master_services to ensure visibility
ALTER TABLE public.master_services DISABLE ROW LEVEL SECURITY;

-- Grant permissions just in case
GRANT ALL ON public.master_services TO anon;
GRANT ALL ON public.master_services TO authenticated;
GRANT ALL ON public.master_services TO service_role;

-- Ensure bookings is also accessible
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.bookings TO anon;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
