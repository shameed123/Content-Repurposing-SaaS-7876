import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database tables structure:
// 1. users (extends auth.users)
//    - id (uuid, primary key)
//    - email (text)
//    - full_name (text)
//    - avatar_url (text)
//    - role (text) - 'user', 'admin', 'super_admin'
//    - subscription_plan (text) - 'free', 'pro', 'business'
//    - credits_remaining (integer)
//    - credits_total (integer)
//    - created_at (timestamp)
//    - updated_at (timestamp)

// 2. content_items
//    - id (uuid, primary key)
//    - user_id (uuid, foreign key)
//    - title (text)
//    - content_type (text) - 'text', 'url', 'file'
//    - original_content (text)
//    - file_url (text)
//    - metadata (jsonb)
//    - created_at (timestamp)

// 3. repurposed_content
//    - id (uuid, primary key)
//    - user_id (uuid, foreign key)
//    - content_item_id (uuid, foreign key)
//    - output_format (text)
//    - tone (text)
//    - generated_content (text)
//    - tokens_used (integer)
//    - model_used (text)
//    - created_at (timestamp)

// 4. subscriptions
//    - id (uuid, primary key)
//    - user_id (uuid, foreign key)
//    - stripe_subscription_id (text)
//    - plan (text)
//    - status (text)
//    - current_period_start (timestamp)
//    - current_period_end (timestamp)
//    - created_at (timestamp)

export default supabase;