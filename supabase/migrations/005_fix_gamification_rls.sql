-- Fix RLS Policy for User Progress Insert
-- This allows users to create their own progress record if the trigger fails or for manual creation.

CREATE POLICY "Users can insert their own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
