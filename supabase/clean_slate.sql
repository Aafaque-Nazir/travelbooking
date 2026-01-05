-- DANGER: This wipes all operational data!
-- Keeps 'profiles' and 'users' so you (Admin) don't get deleted.

TRUNCATE TABLE public.bookings, public.trips, public.routes, public.buses, public.parcels, public.expenses, public.audit_logs RESTART IDENTITY CASCADE;

-- Note: We are NOT deleting 'profiles' so your Admin account remains safe.
