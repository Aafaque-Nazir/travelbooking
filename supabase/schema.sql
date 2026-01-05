-- Enable Row Level Security
alter table if exists public.profiles enable row level security;
alter table if exists public.buses enable row level security;
alter table if exists public.routes enable row level security;
alter table if exists public.trips enable row level security;
alter table if exists public.bookings enable row level security;
alter table if exists public.parcels enable row level security;
alter table if exists public.expenses enable row level security;

-- 0. Profiles Table (Link to Auth)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text check (role in ('admin', 'agent')) default 'agent',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'admin', new.raw_user_meta_data->>'full_name'); -- Defaulting to admin for now as you are the first user
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 1. Buses Table
create table if not exists public.buses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  number_plate text not null unique,
  total_seats integer not null,
  seat_layout_type text not null check (seat_layout_type in ('2+1', '2+2')) -- Simplified for MVP
);

-- 2. Routes Table
create table if not exists public.routes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source_city text not null,
  destination_city text not null,
  default_price numeric not null,
  boarding_points text[] -- Array of strings for simplicity
);

-- 3. Trips Table
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  bus_id uuid references public.buses(id) not null,
  route_id uuid references public.routes(id) not null,
  date date not null,
  status text check (status in ('Scheduled', 'Departed', 'Completed')) default 'Scheduled'
);

-- 4. Bookings Table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  trip_id uuid references public.trips(id) not null,
  seat_number text not null, -- E.g., '1', '2', 'L1', 'U1'
  passenger_name text,
  passenger_phone text,
  amount numeric,
  status text check (status in ('Booked', 'Blocked', 'Cancelled')) default 'Booked',
  gender text check (gender in ('Male', 'Female', 'Other')),
  boarding_point text
);

-- 5. Parcels Table
create table if not exists public.parcels (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  trip_id uuid references public.trips(id) not null,
  sender_name text,
  receiver_phone text,
  item_description text,
  weight numeric,
  amount numeric,
  status text check (status in ('Received', 'Loaded', 'Delivered')) default 'Received'
);

-- 6. Expenses Table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  trip_id uuid references public.trips(id) not null,
  category text check (category in ('Diesel', 'Toll', 'Salary', 'RTO', 'Other')),
  amount numeric not null,
  notes text
);

-- Policies (Open access for MVP dev mode - secure later)
create policy "Enable all access for all users" on public.buses for all using (true) with check (true);
create policy "Enable all access for all users" on public.routes for all using (true) with check (true);
create policy "Enable all access for all users" on public.trips for all using (true) with check (true);
create policy "Enable all access for all users" on public.bookings for all using (true) with check (true);
create policy "Enable all access for all users" on public.parcels for all using (true) with check (true);
create policy "Enable all access for all users" on public.expenses for all using (true) with check (true);
