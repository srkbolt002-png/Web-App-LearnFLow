-- ============================================
-- SIMPLE SUPER ADMIN SETUP
-- ============================================
-- This script helps you create a super admin user manually
-- Run this AFTER you've created the auth user in Supabase Auth Dashboard

-- ============================================
-- STEP 1: Create the security definer function (if not exists)
-- ============================================
-- This prevents infinite recursion in RLS policies
create or replace function public.has_role(_user_id uuid, _role user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- ============================================
-- STEP 2: Assign super_admin role to your user
-- ============================================
-- First, find your user ID from the auth.users table
-- You can run this query to see all users:
-- SELECT id, email, created_at FROM auth.users;

-- Then, assign the super_admin role:
-- Replace 'YOUR_USER_EMAIL_HERE' with the actual email address

insert into public.user_roles (user_id, role)
select id, 'super_admin'::user_role
from auth.users
where email = 'super@admin.com'
on conflict (user_id, role) do nothing;

-- ============================================
-- STEP 3: Verify the super admin was created
-- ============================================
-- Run this query to verify:
select 
  p.id,
  p.name,
  p.email,
  ur.role
from public.profiles p
left join public.user_roles ur on p.id = ur.user_id
where ur.role = 'super_admin';

-- ============================================
-- ALTERNATIVE: Create super admin for any user by ID
-- ============================================
-- If you already know the user ID, you can directly insert:
-- insert into public.user_roles (user_id, role)
-- values ('YOUR_USER_ID_HERE', 'super_admin')
-- on conflict (user_id, role) do nothing;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Make sure the user already exists in auth.users
--    (Create them via Supabase Auth Dashboard or signup form)
-- 
-- 2. The trigger should automatically create a profile
--    when an auth user is created
-- 
-- 3. You can make any existing user a super admin by
--    running the insert statement with their email or ID
