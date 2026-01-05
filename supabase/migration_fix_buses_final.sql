-- 1. Standardization: Ensure correct columns exist
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS number_plate text;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS type text DEFAULT 'Non-AC';
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS seat_layout_type text DEFAULT '2+2';

-- 2. Handle 'total_seats' vs 'capacity' confusion
-- If 'total_seats' doesn't exist but 'capacity' does, rename it.
DO $$ 
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='buses' AND column_name='capacity') THEN
      ALTER TABLE public.buses RENAME COLUMN capacity TO total_seats;
  ELSE
      ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 40;
  END IF;
END $$;

-- 3. Remove Constraints (Allow any text for layout/type)
ALTER TABLE public.buses DROP CONSTRAINT IF EXISTS buses_seat_layout_type_check;
ALTER TABLE public.buses DROP CONSTRAINT IF EXISTS buses_seat_layout_type_check1;

-- 4. Reset RLS Policies Broadly (Fix Permission Issues)
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.buses;
DROP POLICY IF EXISTS "Policy for buses" ON public.buses;

-- Allow ANYONE to do ANYTHING (For Development Speed)
CREATE POLICY "Enable all access for all users" ON public.buses FOR ALL USING (true) WITH CHECK (true);
