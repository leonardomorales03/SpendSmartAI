-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create categories table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text,
  icon text,
  user_id uuid references auth.users(id), -- Nullable for global categories
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on categories
alter table categories enable row level security;

-- Policy: Everyone can read global categories (user_id is null)
create policy "Global categories are viewable by everyone"
  on categories for select
  using (user_id is null);

-- Policy: Users can read their own categories
create policy "Users can view their own categories"
  on categories for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own categories
create policy "Users can insert their own categories"
  on categories for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own categories
create policy "Users can update their own categories"
  on categories for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own categories
create policy "Users can delete their own categories"
  on categories for delete
  using (auth.uid() = user_id);

-- Create transactions table
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  amount decimal(10, 2) not null,
  currency text default 'USD',
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  category_id uuid references categories(id),
  image_url text,
  enriched_data jsonb default '{}'::jsonb, -- Stores extra info from AI (tags, location, merchant, etc.)
  user_id uuid references auth.users(id), -- Linked to Supabase Auth
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed some categories
insert into categories (name, emoji) values
  ('Comida', '🍔'),
  ('Transporte', '🚕'),
  ('Ocio', '🎉'),
  ('Hogar', '🏠'),
  ('Salud', '💊'),
  ('Otros', '📦');

-- Create user_settings table
create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id), -- Linked to Supabase Auth
  monthly_budget decimal(10, 2) default 1000000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings if not exist (for single user MVP - deprecated with Auth)
-- insert into user_settings (monthly_budget)
-- select 1000000
-- where not exists (select 1 from user_settings);
