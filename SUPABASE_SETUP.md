# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Project name
   - Database password (save this!)
   - Region (choose closest to your users)
4. Wait for the project to be created

## 2. Run the SQL Migration

1. In your Supabase dashboard, go to the "SQL Editor" section
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the query editor
5. Click "Run" to execute the migration
6. You should see a success message

## 3. Get Your API Keys

1. Go to Project Settings (gear icon in sidebar)
2. Click on "API" in the settings menu
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## 4. Configure Your Local Environment

1. Create a `.env` file in the root of your project (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **IMPORTANT**: Add `.env` to your `.gitignore` file to keep credentials secure:

```
.env
```

## 5. Install Supabase Client

Run this command to install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

## 6. Test the Connection

1. Restart your development server
2. Try logging in or signing up
3. Check the Supabase dashboard's "Table Editor" to see if data is being created

## 7. Create Initial Admin User (Optional)

If you want to create an admin user, after signing up:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your user's email):

```sql
-- First, find the user's ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Then add admin role using that ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-from-above-query', 'admin');
```

Or to create an instructor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-id-here', 'instructor');
```

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure your `.env` file exists in the project root
- Check that the variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your development server after creating the `.env` file

### Database Connection Issues
- Verify your Project URL and anon key are correct
- Check that the SQL migration ran successfully
- Ensure your Supabase project is active (not paused)

### Authentication Not Working
- Make sure the profiles trigger is created (check migrations)
- Check Supabase Auth logs in the dashboard

## Database Schema Overview

The migration creates the following tables:
- `profiles` - User profile information
- `user_roles` - User role assignments (student, instructor, admin)
- `courses` - Course information
- `lessons` - Course lessons
- `workshops` - Workshop information
- `workshop_sessions` - Workshop session dates/times
- `workshop_enrollments` - Student workshop enrollments
- `comments` - Workshop comments
- `certificates` - Student certificates
- `notifications` - User notifications
- `course_progress` - Course progress tracking
- `lesson_progress` - Individual lesson progress
