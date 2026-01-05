-- Fix Trips Table: Replace 'date' with precise timestamps
alter table public.trips 
add column if not exists departure_time timestamp with time zone,
add column if not exists arrival_time timestamp with time zone,
add column if not exists price numeric;

-- Fix Routes Table: Add missing metadata
alter table public.routes 
add column if not exists distance text, -- e.g. '150 km'
add column if not exists duration text; -- e.g. '3h 30m'

-- Ensure Audit Logs exists (in case previous step was skipped)
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  ip_address text
);
alter table public.audit_logs enable row level security;
create policy "Admins View All" on public.audit_logs for select using (true);
create policy "Insert All" on public.audit_logs for insert with check (true);
