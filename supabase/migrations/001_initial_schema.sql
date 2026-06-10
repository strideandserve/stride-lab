-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (one per user, created on signup)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default 'Runner',
  created_at timestamptz default now()
);

-- SHOES
create table shoes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  brand text not null default 'Unknown',
  category text not null check (category in ('daily','speed','race')),
  max_miles numeric not null default 350,
  start_miles numeric not null default 0,
  size numeric,
  wide text default 'standard',
  added_date date default current_date,
  created_at timestamptz default now()
);

-- RUNS
create table runs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  shoe_id uuid references shoes(id) on delete cascade not null,
  miles numeric not null,
  date date not null,
  pace text,
  hr integer,
  comfort numeric,
  elevation numeric,
  temp numeric,
  humidity numeric,
  location text,
  notes text,
  finish_time text,
  is_race boolean default false,
  race_name text,
  race_type text check (race_type in ('marathon','half','ten_k','five_k','other') or race_type is null),
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table shoes    enable row level security;
alter table runs     enable row level security;

-- PROFILES policies
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- SHOES policies
create policy "Users can view own shoes"   on shoes for select using (auth.uid() = user_id);
create policy "Users can insert own shoes" on shoes for insert with check (auth.uid() = user_id);
create policy "Users can update own shoes" on shoes for update using (auth.uid() = user_id);
create policy "Users can delete own shoes" on shoes for delete using (auth.uid() = user_id);

-- RUNS policies
create policy "Users can view own runs"   on runs for select using (auth.uid() = user_id);
create policy "Users can insert own runs" on runs for insert with check (auth.uid() = user_id);
create policy "Users can update own runs" on runs for update using (auth.uid() = user_id);
create policy "Users can delete own runs" on runs for delete using (auth.uid() = user_id);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Runner'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
