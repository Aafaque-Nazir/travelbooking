-- Remove the restrictive check constraints so specific values like '2+1 Seater' can be stored directly
ALTER TABLE public.buses DROP CONSTRAINT IF EXISTS buses_seat_layout_type_check;
ALTER TABLE public.buses DROP CONSTRAINT IF EXISTS buses_seat_layout_type_check1; -- Just in case auto-named differently

-- Optional: Add a new more flexible constraint if desired, or leave it validation-free for Admin.
-- For now, we trust the Admin UI values.
