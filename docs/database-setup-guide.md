# Database Setup Troubleshooting Guide

## Common Issues and Solutions

### 1. Permission Denied for app.jwt_secret
**Error**: `permission denied to set parameter "app.jwt_secret"`

**Solution**: This parameter is managed by Supabase automatically. The updated script removes this line entirely.

### 2. Relation Does Not Exist
**Error**: `relation "quiz_results" does not exist`

**Solution**: Ensure scripts are run in the correct order:
1. First: `01-create-tables.sql`
2. Second: `02-create-analytics-views.sql`
3. Optional: `03-verify-setup.sql`

### 3. Policy Already Exists
**Error**: `policy "policy_name" for table "table_name" already exists`

**Solution**: The updated scripts include `DROP POLICY IF EXISTS` statements to handle this.

### 4. RLS Not Working
**Issue**: Users can see other users' data

**Solution**: Verify RLS is enabled:
\`\`\`sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
\`\`\`

### 5. Views Not Accessible
**Issue**: Views return permission denied

**Solution**: Ensure proper grants are in place:
\`\`\`sql
GRANT SELECT ON public.archetype_distribution TO authenticated;
GRANT SELECT ON public.user_engagement_stats TO authenticated;
GRANT SELECT ON public.professional_status_distribution TO authenticated;
\`\`\`

## Script Execution Order

1. **01-create-tables.sql** - Creates all base tables, indexes, and RLS policies
2. **02-create-analytics-views.sql** - Creates analytics views (requires tables from step 1)
3. **03-verify-setup.sql** - Verifies everything was created correctly

## Manual Verification Steps

### Check Tables Exist
\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'quiz_results', 'user_activity');
\`\`\`

### Check RLS Policies
\`\`\`sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
\`\`\`

### Check Views
\`\`\`sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
\`\`\`

### Test Data Access
\`\`\`sql
-- This should work for authenticated users
SELECT * FROM public.archetype_distribution;
\`\`\`

## Environment Setup

Ensure these environment variables are set:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Supabase Dashboard Checks

1. **Authentication**: Verify email auth is enabled
2. **Database**: Check tables appear in Table Editor
3. **API**: Verify RLS policies are active
4. **SQL Editor**: Test queries work as expected

## If Problems Persist

1. Drop all objects and start fresh:
\`\`\`sql
DROP VIEW IF EXISTS public.professional_status_distribution;
DROP VIEW IF EXISTS public.user_engagement_stats;
DROP VIEW IF EXISTS public.archetype_distribution;
DROP TABLE IF EXISTS public.user_activity;
DROP TABLE IF EXISTS public.quiz_results;
DROP TABLE IF EXISTS public.user_profiles;
\`\`\`

2. Re-run scripts in order
3. Check Supabase logs for detailed error messages
4. Verify your Supabase project has sufficient permissions
