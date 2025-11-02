# Super Admin Setup Guide

This guide explains how to create a super admin user for your application.

## Prerequisites

1. Lovable Cloud must be enabled
2. Database schema must be set up (run `database-schema.sql` first)

## Method 1: Using the Edge Function (Recommended)

This automatically creates the super admin user with credentials:

1. The edge function `setup-demo-users` is automatically deployed
2. Call it from your application or using curl:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/setup-demo-users
```

3. This creates:
   - **Email**: super@admin.com
   - **Password**: 12345678
   - **Role**: super_admin

4. **Important**: Change the password immediately after first login!

## Method 2: Manual SQL Setup

If you want to make an existing user a super admin:

1. Open your Lovable Cloud SQL editor
2. Run the SQL from `setup-super-admin.sql`
3. Replace 'super@admin.com' with your user's email:

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin'::user_role
from auth.users
where email = 'YOUR_EMAIL_HERE'
on conflict (user_id, role) do nothing;
```

## Verify Super Admin Setup

Run this query to check if the super admin was created successfully:

```sql
select 
  p.id,
  p.name,
  p.email,
  ur.role
from public.profiles p
left join public.user_roles ur on p.id = ur.user_id
where ur.role = 'super_admin';
```

## What Gets Created

- **Auth User**: Created in Supabase Auth
- **Profile**: Automatically created via trigger
- **User Role**: Assigned as 'super_admin' in user_roles table

## Security Notes

1. The security definer function `has_role()` is created to prevent RLS recursion
2. Roles are stored in a separate `user_roles` table (not in profiles)
3. Always use strong passwords for super admin accounts
4. Consider enabling 2FA for super admin accounts

## Next Steps

After creating the super admin:

1. Login with the super admin credentials
2. Change the password immediately
3. Use the admin panel to create department admins
4. Department admins can then create instructors and students
