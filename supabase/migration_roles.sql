-- 1. Create Profiles Table (if not exists)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text check (role in ('admin', 'agent')) default 'agent',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 3. Create Trigger for New Users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'admin', new.raw_user_meta_data->>'full_name'); -- Defaulting to 'admin' as requested
  return new;
end;
$$ language plpgsql security definer;

-- 4. Attach Trigger to Auth.Users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
