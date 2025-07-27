# Admin Setup Guide

## 1. Connect to Supabase
First, connect your Supabase project using the correct organization and project names.

## 2. Create Admin Users via SQL

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create the admin user (you'll need to sign up first through the app)
-- Then update the role

-- Super Admin
UPDATE users 
SET role = 'super_admin',
    full_name = 'Super Admin'
WHERE email = 'admin@contentengine.com';

-- Regular Admin  
UPDATE users 
SET role = 'admin',
    full_name = 'Admin User'
WHERE email = 'moderator@contentengine.com';

-- Give admin users more credits
UPDATE users 
SET credits_remaining = 1000,
    credits_total = 1000
WHERE role IN ('admin', 'super_admin');
```

## 3. Mock User Credentials

### Super Admin
- **Email:** admin@contentengine.com
- **Password:** admin123456
- **Role:** super_admin
- **Access:** Full admin dashboard, all features

### Regular Admin
- **Email:** moderator@contentengine.com  
- **Password:** admin123456
- **Role:** admin
- **Access:** Admin dashboard, user management

### Regular User
- **Email:** user@contentengine.com
- **Password:** user123456
- **Role:** user
- **Access:** Regular user features only

## 4. Testing Admin Access

1. Sign up with the admin email through the normal signup process
2. Run the SQL update commands above
3. Sign out and sign back in
4. Navigate to `/admin` to access the admin dashboard

## 5. Admin Features

The admin dashboard includes:
- User statistics
- Revenue tracking
- Recent user activity
- System status monitoring
- User management capabilities

## 6. Security Notes

- Change default passwords in production
- Use strong passwords for admin accounts
- Consider implementing 2FA for admin accounts
- Regularly audit admin access logs