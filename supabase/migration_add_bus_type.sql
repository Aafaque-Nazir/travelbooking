-- Add 'type' column to buses table
ALTER TABLE public.buses 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'Non-AC Seater';

-- Rename 'capacity' to 'total_seats' if it exists (legacy from seed mismatch), or just ensure total_seats exists
DO $$ 
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='buses' AND column_name='capacity') THEN
      ALTER TABLE public.buses RENAME COLUMN capacity TO total_seats;
  END IF;
END $$;
