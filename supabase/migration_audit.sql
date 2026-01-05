-- 1. Create Audit Logs Table
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  action text not null, -- e.g., 'CREATE_BUS', 'CANCEL_ticket'
  details jsonb, -- e.g., { bus_id: '...', old_status: '...' }
  ip_address text
);

-- 2. Enable RLS
alter table public.audit_logs enable row level security;
create policy "Admins can view all audit logs" on public.audit_logs for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
create policy "System can insert logs" on public.audit_logs for insert with check (true);
