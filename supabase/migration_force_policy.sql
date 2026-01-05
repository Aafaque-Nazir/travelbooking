-- Forcefully reset RLS on buses table with a UNIQUE policy name
-- This avoids "Policy already exists" errors if the previous drop failed.

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- 1. Drop old policies just in case
DROP POLICY IF EXISTS "Enable all access for all users" ON public.buses;
DROP POLICY IF EXISTS "Policy for buses" ON public.buses;
DROP POLICY IF EXISTS "Allow All Access Buses 2024" ON public.buses;

-- 2. Create a NEW, uniquely named policy that allows EVERYTHING (Select, Insert, Update, Delete)
CREATE POLICY "Super_Admin_Access_Buses_V2" 
ON public.buses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Verify Columns (Just to be safe for visibility)
-- Ensure 'created_at' exists as the front-end sorts by it
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
