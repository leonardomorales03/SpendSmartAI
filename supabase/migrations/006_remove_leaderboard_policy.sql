-- Remove Leaderboard Policy
-- To prevent email exposure and enforce privacy, we remove the policy that allowed viewing all user progress.

DROP POLICY IF EXISTS "Users can view all progress for leaderboard" ON user_progress;

-- Verify that the "Users can view their own progress" policy still exists (from 004_gamification.sql)
-- CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
