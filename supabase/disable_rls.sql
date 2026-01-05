-- RLS is the #1 cause of "Data Saved but not Visible"
-- We will DISABLE it completely for the buses table to prove it works.

ALTER TABLE public.buses DISABLE ROW LEVEL SECURITY;

-- Also verify the table exists and has data
-- This query won't show in your app, but running it in SQL Editor will show you if data exists.
SELECT count(*) as total_buses FROM public.buses;
