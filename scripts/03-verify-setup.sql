-- Verification script to check database setup
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'quiz_results', 'user_activity');
    
    RAISE NOTICE 'Tables created: % out of 3', table_count;
    
    -- Check views
    SELECT COUNT(*) INTO view_count 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name IN ('archetype_distribution', 'user_engagement_stats', 'professional_status_distribution');
    
    RAISE NOTICE 'Views created: % out of 3', view_count;
    
    -- Check RLS policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'quiz_results', 'user_activity');
    
    RAISE NOTICE 'RLS policies created: %', policy_count;
    
    -- Check indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'Indexes created: %', index_count;
    
    -- Summary
    IF table_count = 3 AND view_count = 3 AND policy_count >= 8 THEN
        RAISE NOTICE '✅ Database setup completed successfully!';
    ELSE
        RAISE NOTICE '⚠️  Some components may be missing. Please check the logs above.';
    END IF;
END $$;

-- Show table information using standard SQL queries instead of psql commands
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'quiz_results', 'user_activity')
ORDER BY table_name, ordinal_position;

-- Show view definitions
SELECT 
    table_name as view_name,
    LEFT(view_definition, 100) || '...' as view_definition_preview
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('archetype_distribution', 'user_engagement_stats', 'professional_status_distribution');

-- Show RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'quiz_results', 'user_activity');

-- Show all policies for our tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'quiz_results', 'user_activity')
ORDER BY tablename, policyname;

-- Test basic functionality (this will only work if you're authenticated)
-- Uncomment these lines to test data access:
-- SELECT 'Testing archetype_distribution view...' as test;
-- SELECT * FROM public.archetype_distribution LIMIT 1;
-- SELECT 'Testing user_engagement_stats view...' as test;
-- SELECT * FROM public.user_engagement_stats LIMIT 1;
-- SELECT 'Testing professional_status_distribution view...' as test;
-- SELECT * FROM public.professional_status_distribution LIMIT 1;
