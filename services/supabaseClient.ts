
import { createClient } from '@supabase/supabase-js';

/**
 * Configure your Supabase credentials.
 * Use environment variables for deployment.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_ACTUAL_URL_HERE';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_ACTUAL_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
