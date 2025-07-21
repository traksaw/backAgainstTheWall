-- Verify that required tables exist before creating views
DO $$
BEGIN
    -- Check if quiz_results table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_results') THEN
        RAISE EXCEPTION 'Table quiz_results does not exist. Please run 01-create-tables.sql first.';
    END IF;
    
    -- Check if user_profiles table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'Table user_profiles does not exist. Please run 01-create-tables.sql first.';
    END IF;
END $$;

-- Drop existing views if they exist to avoid conflicts
DROP VIEW IF EXISTS public.archetype_distribution;
DROP VIEW IF EXISTS public.user_engagement_stats;
DROP VIEW IF EXISTS public.professional_status_distribution;

-- Create views for analytics and reporting
CREATE VIEW public.archetype_distribution AS
SELECT 
  archetype,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 2) as percentage
FROM quiz_results 
GROUP BY archetype
ORDER BY count DESC;

-- Create view for user engagement metrics
CREATE VIEW public.user_engagement_stats AS
SELECT 
  DATE_TRUNC('day', completed_at) as date,
  COUNT(*) as quizzes_completed,
  COUNT(CASE WHEN has_viewed_results THEN 1 END) as results_viewed,
  COUNT(CASE WHEN has_watched_film THEN 1 END) as films_watched,
  ROUND(
    COUNT(CASE WHEN has_viewed_results THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2
  ) as results_view_rate,
  ROUND(
    COUNT(CASE WHEN has_watched_film THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2
  ) as film_completion_rate
FROM quiz_results 
GROUP BY DATE_TRUNC('day', completed_at)
ORDER BY date DESC;

-- Create view for professional status distribution
CREATE VIEW public.professional_status_distribution AS
SELECT 
  up.professional_status,
  COUNT(*) as total_users,
  COUNT(qr.id) as completed_quizzes,
  ROUND(COUNT(qr.id) * 100.0 / NULLIF(COUNT(*), 0), 2) as completion_rate
FROM user_profiles up
LEFT JOIN quiz_results qr ON up.id = qr.user_id
GROUP BY up.professional_status
ORDER BY total_users DESC;

-- Grant access to authenticated users for analytics views
GRANT SELECT ON public.archetype_distribution TO authenticated;
GRANT SELECT ON public.user_engagement_stats TO authenticated;
GRANT SELECT ON public.professional_status_distribution TO authenticated;

-- Grant access to the base tables for authenticated users (they already have RLS policies)
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.quiz_results TO authenticated;
GRANT SELECT, INSERT ON public.user_activity TO authenticated;

-- Ensure authenticated users can use the sequence for generating UUIDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
