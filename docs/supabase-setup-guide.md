# Supabase Integration Setup Guide

This guide will help you set up Supabase backend integration for the questionnaire application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created
3. Node.js and npm/yarn installed

## Step 1: Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

### How to get these values:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Database Schema Setup

Run the following SQL scripts in your Supabase SQL Editor in this exact order:

### 1. Create Tables (`01-create-tables.sql`)

\`\`\`sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  professional_status TEXT NOT NULL CHECK (professional_status IN ('working-professional', 'dedicated-student', 'entrepreneur', 'retired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  archetype TEXT NOT NULL CHECK (archetype IN ('Avoider', 'Gambler', 'Realist', 'Architect')),
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  has_viewed_results BOOLEAN DEFAULT FALSE,
  has_watched_film BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity table for tracking engagement
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('signup', 'quiz_completed', 'results_viewed', 'film_watched', 'profile_updated')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_archetype ON quiz_results(archetype);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
\`\`\`

### 2. Create RLS Policies (`02-create-policies.sql`)

\`\`\`sql
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can insert own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can update own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can delete own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;

-- User profiles: users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Quiz results: users can only see and modify their own results
CREATE POLICY "Users can view own quiz results" ON public.quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz results" ON public.quiz_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz results" ON public.quiz_results
  FOR DELETE USING (auth.uid() = user_id);

-- User activity: users can only see their own activity
CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);
\`\`\`

### 3. Create Analytics Views (`03-create-views.sql`)

\`\`\`sql
-- Create views for analytics and reporting
CREATE OR REPLACE VIEW public.archetype_distribution AS
SELECT 
  archetype,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 2) as percentage
FROM quiz_results 
GROUP BY archetype
ORDER BY count DESC;

-- Create view for user engagement metrics
CREATE OR REPLACE VIEW public.user_engagement_stats AS
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

-- Grant access to authenticated users for analytics views
GRANT SELECT ON public.archetype_distribution TO authenticated;
GRANT SELECT ON public.user_engagement_stats TO authenticated;

-- Grant access to the base tables for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_results TO authenticated;
GRANT SELECT, INSERT ON public.user_activity TO authenticated;

-- Ensure authenticated users can use the sequence for generating UUIDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
\`\`\`

### 4. Create Triggers (`04-create-triggers.sql`)

\`\`\`sql
-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_quiz_results_updated_at ON public.quiz_results;

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_results_updated_at
  BEFORE UPDATE ON public.quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Step 3: Authentication Setup

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Enable **Email** authentication
3. Configure your site URL in **Site URL** field (e.g., `http://localhost:3000` for development)
4. Add your production URL to **Additional Redirect URLs** when deploying

## Step 4: Testing the Integration

1. Start your Next.js application:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Open the application and sign up for a new account
3. Take the quiz to test data storage
4. Check your Supabase dashboard to verify data is being stored

## Step 5: Verification

Use the built-in database status component to verify your setup:

1. Sign in to your application
2. Click the database status icon in the user menu
3. Check connection status and table availability
4. Sync any local data if needed

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies prevent unauthorized access

### Data Validation
- Input validation on both client and server side
- Type checking with TypeScript
- Database constraints for data integrity

### Error Handling
- Graceful fallback to localStorage if database is unavailable
- Comprehensive error logging
- User-friendly error messages

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify environment variables are correct
   - Check Supabase project is active
   - Ensure API keys are valid

2. **Tables Not Found**
   - Run migration scripts in correct order
   - Check SQL Editor for any errors
   - Verify table names match exactly

3. **Permission Denied**
   - Ensure RLS policies are created
   - Check user authentication status
   - Verify policy conditions

4. **Data Not Syncing**
   - Check browser console for errors
   - Verify network connectivity
   - Test with database status component

### Getting Help

1. Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the application logs in browser console
3. Use the database status component for diagnostics
4. Check Supabase dashboard logs for server-side errors

## Production Deployment

1. Update environment variables with production Supabase URLs
2. Configure proper CORS settings in Supabase
3. Set up proper backup and monitoring
4. Test all functionality in production environment

## Data Migration

If you have existing localStorage data, use the sync functionality:

1. Sign in to your account
2. Open database status component
3. Click "Sync Local Data to Database"
4. Verify data appears in Supabase dashboard

This will migrate all existing quiz results to the database while maintaining data integrity.
