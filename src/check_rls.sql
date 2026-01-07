-- CHECK AND FIX RLS POLICIES FOR ROUTES TABLE
-- The save operation might be hanging because RLS is enabled but there are no INSERT/UPDATE policies

-- 1. Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'routes';

-- 2. Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'routes';

-- 3. OPTION A: DISABLE RLS (Not recommended for production, but works for dev)
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;

-- 4. OPTION B: Create proper policies (Better for production)
-- Drop any existing policies first
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON routes;

-- Create a policy that allows authenticated users to do everything
-- CREATE POLICY "Allow all operations for authenticated users" 
-- ON routes 
-- FOR ALL 
-- TO authenticated 
-- USING (true) 
-- WITH CHECK (true);

-- 5. Verify
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'routes';
