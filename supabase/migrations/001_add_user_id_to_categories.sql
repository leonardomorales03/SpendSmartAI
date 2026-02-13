-- Add user_id column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Global categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create policies

-- 1. Everyone can read global categories (user_id is NULL)
CREATE POLICY "Global categories are viewable by everyone"
  ON categories FOR SELECT
  USING (user_id IS NULL);

-- 2. Users can read their own categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Users can insert their own categories
CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own categories
CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Users can delete their own categories
CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);
