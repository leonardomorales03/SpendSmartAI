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
  currency text default 'COP',
  locale text default 'es-CO',
  language text default 'es',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings if not exist (for single user MVP - deprecated with Auth)
-- insert into user_settings (monthly_budget)
-- select 1000000
-- where not exists (select 1 from user_settings);
-- Create category_budgets table
create table if not exists category_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  category_id uuid references categories(id) not null,
  amount decimal(10, 2) not null check (amount >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category_id)
);

-- Enable RLS
alter table category_budgets enable row level security;

-- Policies
create policy "Users can view their own category budgets"
  on category_budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own category budgets"
  on category_budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own category budgets"
  on category_budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own category budgets"
  on category_budgets for delete
  using (auth.uid() = user_id);

-- GAMIFICATION SYSTEM

-- 1. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    smart_coins INTEGER DEFAULT 0,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL,
    category TEXT DEFAULT 'GENERAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- 4. Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- User Progress Policies
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Everyone can read achievements" ON achievements
    FOR SELECT USING (true);

-- User Achievements Policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Analytics Policies
CREATE POLICY "Users can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Initial Seed Data for Achievements
INSERT INTO achievements (code, title, description, icon_name, xp_reward, condition_type, condition_value, category) VALUES
('FIRST_STEP', 'Primer Paso', 'Registra tu primer gasto', 'Footprints', 50, 'TRANSACTION_COUNT', 1, 'GENERAL'),
('STREAK_3', 'En Racha', 'Mantén una racha de 3 días', 'Flame', 100, 'STREAK_DAYS', 3, 'STREAK'),
('STREAK_7', 'Imparable', 'Mantén una racha de 7 días', 'Zap', 300, 'STREAK_DAYS', 7, 'STREAK'),
('BUDGET_MASTER', 'Maestro del Presupuesto', 'Registra 50 gastos en total', 'Target', 500, 'TRANSACTION_COUNT', 50, 'BUDGET'),
('NIGHT_OWL', 'Búho Nocturno', 'Registra un gasto después de las 10 PM', 'Moon', 50, 'TIME_LATE', 1, 'GENERAL'),
('EARLY_BIRD', 'Madrugador', 'Registra un gasto antes de las 7 AM', 'Sun', 50, 'TIME_EARLY', 1, 'GENERAL')
ON CONFLICT (code) DO NOTHING;

-- 7. Functions & Triggers

-- Function to handle new user creation (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, display_name)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created_gamification ON auth.users;
CREATE TRIGGER on_auth_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_gamification();
