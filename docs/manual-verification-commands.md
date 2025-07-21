# Manual Verification Commands

## For Supabase SQL Editor

Use these standard SQL queries in the Supabase SQL Editor:

### Check All Tables
\`\`\`sql
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
\`\`\`

### Check Table Structures
\`\`\`sql
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
\`\`\`

### Check Views
\`\`\`sql
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public';
\`\`\`

### Check RLS Policies
\`\`\`sql
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
\`\`\`

### Test Views (when authenticated)
\`\`\`sql
-- Test archetype distribution
SELECT * FROM public.archetype_distribution;

-- Test user engagement stats  
SELECT * FROM public.user_engagement_stats;

-- Test professional status distribution
SELECT * FROM public.professional_status_distribution;
\`\`\`

## For PostgreSQL Command Line (psql)

If you have direct PostgreSQL access, you can use these psql commands:

### Table Descriptions
\`\`\`
\\d+ public.user_profiles
\\d+ public.quiz_results  
\\d+ public.user_activity
\`\`\`

### List All Tables
\`\`\`
\\dt public.*
\`\`\`

### List All Views
\`\`\`
\\dv public.*
\`\`\`

### Show Policies
\`\`\`
\\dp public.user_profiles
\\dp public.quiz_results
\\dp public.user_activity
\`\`\`

## Verification Checklist

- [ ] 3 tables created: user_profiles, quiz_results, user_activity
- [ ] 3 views created: archetype_distribution, user_engagement_stats, professional_status_distribution  
- [ ] RLS enabled on all tables
- [ ] At least 8 RLS policies created (view, insert, update for each table)
- [ ] 5 indexes created (idx_quiz_results_user_id, etc.)
- [ ] Views return data without errors
- [ ] Users can only access their own data

## Common Issues

### Views Return Empty Results
This is normal if no users have taken the quiz yet. The views will populate as users interact with the application.

### Permission Denied on Views
Ensure you're authenticated and the GRANT statements were executed:
\`\`\`sql
GRANT SELECT ON public.archetype_distribution TO authenticated;
GRANT SELECT ON public.user_engagement_stats TO authenticated;
GRANT SELECT ON public.professional_status_distribution TO authenticated;
\`\`\`

### RLS Blocking Access
This is expected behavior. RLS policies ensure users only see their own data. Test with actual user authentication in the application.
