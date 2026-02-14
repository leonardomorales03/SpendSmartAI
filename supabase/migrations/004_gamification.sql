-- Gamification System Migration

-- 1. User Progress Table
-- Tracks level, XP, streaks, and virtual currency
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    smart_coins INTEGER DEFAULT 0,
    display_name TEXT, -- For leaderboard
    avatar_url TEXT, -- For leaderboard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Achievements Table
-- Defines available achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- e.g., 'FIRST_TRANSACTION'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- Lucide icon name
    xp_reward INTEGER DEFAULT 100,
    condition_type TEXT NOT NULL, -- 'TRANSACTION_COUNT', 'STREAK_DAYS', 'TOTAL_SPENT', etc.
    condition_value INTEGER NOT NULL,
    category TEXT DEFAULT 'GENERAL', -- 'STREAK', 'BUDGET', 'SAVING'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Achievements Table
-- Tracks unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- 4. Analytics Events Table
-- Simple tracking for user behavior
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

-- User Progress: Users can view their own progress
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Leaderboard: Authenticated users can view basic info of others (display_name, level, xp)
-- Note: This requires a separate policy or view if we want to strict RLS, but for MVP we allow reading specific columns via API or just open select for now.
-- Actually, let's allow reading all user_progress for leaderboard but restrict writes.
CREATE POLICY "Users can view all progress for leaderboard" ON user_progress
    FOR SELECT USING (true);

-- Users can only update their own progress (mostly handled by server actions, but good for safety)
CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: Everyone can read definitions
CREATE POLICY "Everyone can read achievements" ON achievements
    FOR SELECT USING (true);

-- User Achievements: Users can view their own
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Analytics: Insert only
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

-- Backfill existing users
INSERT INTO public.user_progress (user_id, display_name)
SELECT id, split_part(email, '@', 1) FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_progress);
