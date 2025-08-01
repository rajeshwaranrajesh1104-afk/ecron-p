import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface EventRegistration {
  id: string;
  user_id: string;
  name: string;
  degree: 'UG' | 'PG';
  year: '1' | '2' | '3' | '4';
  college_name: string;
  university_name: string;
  contact_number: string;
  alternate_number?: string;
  email_id: string;
  certificate_code: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_registered: boolean;
  registration_id?: string;
  created_at: string;
  updated_at: string;
}