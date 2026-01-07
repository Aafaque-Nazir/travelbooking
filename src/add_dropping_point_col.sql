-- Check if dropping_point exists in bookings, and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'dropping_point'
    ) THEN
        ALTER TABLE bookings ADD COLUMN dropping_point TEXT;
    END IF;
END $$;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings';
