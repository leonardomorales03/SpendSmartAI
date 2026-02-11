-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create categories table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
  user_id uuid, -- For Auth, optional for MVP if single user
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
  monthly_budget decimal(10, 2) default 1000000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings if not exist (for single user MVP)
insert into user_settings (monthly_budget)
select 1000000
where not exists (select 1 from user_settings);
