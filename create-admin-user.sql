-- SQL script to create admin users
-- Run this in your Supabase SQL editor after users have signed up

-- Create super admin
UPDATE users 
SET 
    role = 'super_admin',
    full_name = 'Super Admin',
    credits_remaining = 1000,
    credits_total = 1000,
    subscription_plan = 'business'
WHERE email = 'admin@contentengine.com';

-- Create regular admin
UPDATE users 
SET 
    role = 'admin',
    full_name = 'Admin User',
    credits_remaining = 500,
    credits_total = 500,
    subscription_plan = 'pro'
WHERE email = 'moderator@contentengine.com';

-- Verify the changes
SELECT id, email, full_name, role, credits_remaining, subscription_plan 
FROM users 
WHERE role IN ('admin', 'super_admin');