-- ============================================
-- CLEANUP: Drop existing tables and types
-- ============================================

-- Drop triggers first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop functions
drop function if exists public.setup_demo_hierarchy();
drop function if exists public.setup_demo_accounts();
drop function if exists public.handle_new_user();
drop function if exists public.has_role(uuid, user_role);

-- Drop tables (in reverse dependency order)
drop table if exists public.student_information_requests cascade;
drop table if exists public.user_invitations cascade;
drop table if exists public.lesson_progress cascade;
drop table if exists public.course_progress cascade;
drop table if exists public.course_enrollments cascade;
drop table if exists public.notifications cascade;
drop table if exists public.certificates cascade;
drop table if exists public.comments cascade;
drop table if exists public.workshop_enrollments cascade;
drop table if exists public.workshop_sessions cascade;
drop table if exists public.workshops cascade;
drop table if exists public.lessons cascade;
drop table if exists public.courses cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.profiles cascade;
drop table if exists public.departments cascade;

-- Drop enum types
drop type if exists public.notification_type;
drop type if exists public.workshop_status;
drop type if exists public.user_role;

-- ============================================
-- SCHEMA SETUP
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type public.user_role as enum ('super_admin', 'department_admin', 'instructor', 'student');
create type public.workshop_status as enum ('upcoming', 'ongoing', 'completed');
create type public.notification_type as enum ('course_update', 'new_lesson', 'achievement', 'workshop_live', 'workshop_update', 'certificate_issued', 'enrollment');

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
create table public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  code text not null unique,
  description text,
  created_at timestamptz default now()
);

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar text,
  bio text,
  department_id uuid references public.departments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean default true,
  student_id text,
  employee_id text,
  created_at timestamptz default now()
);

-- ============================================
-- USER ROLES TABLE
-- ============================================
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role user_role not null,
  unique(user_id, role)
);

-- ============================================
-- USER INVITATIONS TABLE
-- ============================================
create table public.user_invitations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  temporary_password text not null,
  is_password_changed boolean default false,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- ============================================
-- COURSES TABLE
-- ============================================
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  instructor_name text not null,
  department_id uuid references public.departments(id) on delete cascade not null,
  category text not null,
  level text not null,
  duration text not null,
  thumbnail text,
  video_url text,
  created_at timestamptz default now()
);

-- ============================================
-- LESSONS TABLE
-- ============================================
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text,
  duration text,
  order_index integer not null,
  created_at timestamptz default now()
);

-- VIDEO STORAGE STRATEGY FOR LESSONS:
-- - video_storage_path: Path to video file in Supabase Storage 'lesson-videos' bucket (PREFERRED)
-- - video_url: Legacy field for backward compatibility with existing external URLs
-- - New lessons should ONLY use video_storage_path (Supabase Storage uploads)
-- 
-- NOTE: Workshop live sessions continue to use vimeo_live_url in workshop_sessions table
-- for live streaming (this is separate from on-demand course videos).

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_storage_path text;

-- ============================================
-- STORAGE BUCKET SETUP (RLS DISABLED)
-- ============================================
-- Create public storage bucket for lesson videos with file limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos', 
  'lesson-videos', 
  true,  -- Public bucket for easy access
  524288000,  -- 500MB limit per file
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COURSE ENROLLMENTS TABLE
-- ============================================
create table public.course_enrollments (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(course_id, student_id)
);

-- ============================================
-- WORKSHOPS TABLE
-- ============================================
create table public.workshops (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  instructor_name text not null,
  department_id uuid references public.departments(id) on delete cascade not null,
  category text not null,
  thumbnail text,
  max_students integer not null default 30,
  status workshop_status not null default 'upcoming',
  created_at timestamptz default now()
);

-- ============================================
-- WORKSHOP SESSIONS TABLE
-- ============================================
create table public.workshop_sessions (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  vimeo_live_url text,
  is_live boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- WORKSHOP ENROLLMENTS TABLE
-- ============================================
create table public.workshop_enrollments (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(workshop_id, student_id)
);

-- ============================================
-- COMMENTS TABLE
-- ============================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  message text not null,
  created_at timestamptz default now()
);

-- ============================================
-- CERTIFICATES TABLE
-- ============================================
create table public.certificates (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references public.workshops(id) on delete cascade not null,
  workshop_title text not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  instructor_id uuid references public.profiles(id) on delete cascade not null,
  instructor_name text not null,
  issued_at timestamptz default now(),
  unique(workshop_id, student_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id text not null,
  item_title text not null,
  item_type text not null,
  type notification_type not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- COURSE PROGRESS TABLE
-- ============================================
create table public.course_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  last_accessed timestamptz default now(),
  total_time_spent integer default 0,
  completion_percentage integer default 0,
  learning_streak integer default 0,
  last_activity_date date,
  achievements jsonb default '[]'::jsonb,
  unique(user_id, course_id)
);

-- ============================================
-- LESSON PROGRESS TABLE
-- ============================================
create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  course_progress_id uuid references public.course_progress(id) on delete cascade not null,
  lesson_id uuid not null,
  completed boolean default false,
  time_spent integer default 0,
  video_watch_time integer default 0,
  current_position integer default 0,
  last_watched timestamptz
);

-- ============================================
-- STUDENT INFORMATION REQUESTS TABLE
-- ============================================
create table public.student_information_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete cascade not null,
  student_id text not null unique,
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now()
);

-- Add indexes for better query performance
create index idx_info_requests_dept_status on public.student_information_requests(department_id, status);
create index idx_info_requests_student_id on public.student_information_requests(student_id);

-- Add unique constraint to student_id in profiles table
alter table public.profiles 
add constraint unique_student_id unique (student_id);

-- Add check constraint for student_id format (optional but recommended)
alter table public.profiles
add constraint check_student_id_format 
check (student_id is null or student_id ~ '^[A-Z]{2,4}[0-9]+$');

-- ============================================
-- TRIGGER FUNCTION FOR NEW USER PROFILE
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
exception
  when others then
    raise log 'Error in handle_new_user: %', sqlerrm;
    return new;
end;
$$;

-- ============================================
-- TRIGGER SETUP
-- ============================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- DEMO DEPARTMENTS
-- ============================================
insert into public.departments (name, code, description) values
  ('Computer Science', 'CS', 'Computer Science and Engineering'),
  ('Electrical Engineering', 'EE', 'Electrical and Electronics Engineering'),
  ('Mechanical Engineering', 'ME', 'Mechanical Engineering');

-- ============================================
-- FIXED DEMO HIERARCHY SETUP FUNCTION
-- ============================================
create or replace function setup_demo_hierarchy()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_super_admin_id uuid;
  v_dept_admin_id uuid;
  v_instructor_id uuid;
  v_student_id uuid;
  v_cs_dept_id uuid;
  v_course_id uuid;
  v_lesson_id uuid;
  v_workshop_id uuid;
  v_session_id uuid;
begin
  -- Get CS department ID (ensure single result)
  select id into v_cs_dept_id 
  from public.departments 
  where code = 'CS'
  limit 1;

  -- Get user IDs from auth.users (ensure single row each)
  select id into v_super_admin_id 
  from auth.users 
  where email = 'super@admin.com'
  order by created_at asc
  limit 1;

  select id into v_dept_admin_id 
  from auth.users 
  where email = 'dept@admin.com'
  order by created_at asc
  limit 1;

  select id into v_instructor_id 
  from auth.users 
  where email = 'instructor@test.com'
  order by created_at asc
  limit 1;

  select id into v_student_id 
  from auth.users 
  where email = 'student@test.com'
  order by created_at asc
  limit 1;

  -- Update profiles with department
  update public.profiles 
  set department_id = v_cs_dept_id 
  where id in (v_super_admin_id, v_dept_admin_id, v_instructor_id, v_student_id);

  -- Assign roles safely
  insert into public.user_roles (user_id, role) values
    (v_super_admin_id, 'super_admin'),
    (v_dept_admin_id, 'department_admin'),
    (v_instructor_id, 'instructor'),
    (v_student_id, 'student')
  on conflict (user_id, role) do nothing;

  -- Create a demo course
  insert into public.courses (
    title, description, instructor_id, instructor_name, 
    department_id, category, level, duration, thumbnail, video_url
  )
  values (
    'Introduction to React',
    'Learn the basics of React framework',
    v_instructor_id,
    (select name from public.profiles where id = v_instructor_id limit 1),
    v_cs_dept_id,
    'Web Development',
    'Beginner',
    '4 weeks',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    'https://www.youtube.com/watch?v=SqcY0GlETPk'
  )
  returning id into v_course_id;

  -- Create demo lessons
  insert into public.lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_course_id, 'React Basics', 'Introduction to React', 'https://www.youtube.com/watch?v=SqcY0GlETPk', '15:00', 1),
    (v_course_id, 'Components', 'Understanding Components', 'https://www.youtube.com/watch?v=SqcY0GlETPk', '20:00', 2);

  -- Enroll student in course
  insert into public.course_enrollments (course_id, student_id)
  values (v_course_id, v_student_id)
  on conflict (course_id, student_id) do nothing;

  -- Create course progress
  insert into public.course_progress (user_id, course_id, completion_percentage)
  values (v_student_id, v_course_id, 25)
  on conflict (user_id, course_id) do nothing;

  -- Create a demo workshop
  insert into public.workshops (
    title, description, instructor_id, instructor_name,
    department_id, category, thumbnail, max_students, status
  )
  values (
    'React Hooks Workshop',
    'Deep dive into React Hooks',
    v_instructor_id,
    (select name from public.profiles where id = v_instructor_id limit 1),
    v_cs_dept_id,
    'Web Development',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    30,
    'upcoming'
  )
  returning id into v_workshop_id;

  -- Create workshop session
  insert into public.workshop_sessions (workshop_id, date, start_time, end_time, vimeo_live_url, is_live)
  values (
    v_workshop_id,
    current_date + interval '7 days',
    '14:00:00',
    '16:00:00',
    'https://vimeo.com/event/123456/embed',
    false
  )
  returning id into v_session_id;

  -- Enroll student in workshop
  insert into public.workshop_enrollments (workshop_id, student_id)
  values (v_workshop_id, v_student_id)
  on conflict (workshop_id, student_id) do nothing;

  raise notice '✅ Demo hierarchy created successfully!';
exception
  when others then
    raise warning '⚠️ setup_demo_hierarchy failed: %', sqlerrm;
end;
$$;


-- ================================================
-- SETUP INSTRUCTIONS
-- ================================================
-- To set up the demo hierarchy:
-- 1. Create these users in Supabase Auth Dashboard (EXACT emails required):
--    - super@admin.com (password: Admin123!)
--    - dept@admin.com (password: Admin123!)
--    - instructor@test.com (password: Test123!)
--    - student@test.com (password: Test123!)
--
-- 2. Create missing profiles for existing Auth users
-- insert into public.profiles (id, name, email)
-- select id, split_part(email, '@', 1), email
-- from auth.users
-- where id not in (select id from public.profiles);
--
-- 3. insert into public.user_roles (user_id, role)
-- values
--   ((select id from public.profiles where email = 'super@admin.com'), 'super_admin'),
--   ((select id from public.profiles where email = 'dept@admin.com'), 'department_admin'),
--   ((select id from public.profiles where email = 'instructor@test.com'), 'instructor'),
--   ((select id from public.profiles where email = 'student@test.com'), 'student')
-- on conflict (user_id, role) do nothing;
--
-- 4. Run this function to set up demo data:
--    select setup_demo_hierarchy();
--
-- This will:
--  - Assign all users to Computer Science department
--  - Link department_id in profiles table
--  - Create demo courses, lessons, workshops, and enrollments
--
-- ================================================
-- VERIFICATION QUERY
-- ================================================
-- Run this query to verify your setup worked correctly:
--
-- select 
--   p.email, 
--   p.name, 
--   p.department_id,
--   d.name as department_name,
--   d.code as department_code,
--   ur.role
-- from public.profiles p
-- left join public.departments d on p.department_id = d.id
-- left join public.user_roles ur on p.id = ur.user_id
-- order by ur.role;
--
-- Expected results:
-- - All 4 users should have department_id populated
-- - dept@admin.com should be linked to Computer Science department
-- - Each user should have their appropriate role assigned
-- ================================================
