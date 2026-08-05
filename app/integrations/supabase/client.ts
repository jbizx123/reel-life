import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://jiqxzqxpannhxazlodbr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcXh6cXhwYW5uaHhhemxvZGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTQwNTYsImV4cCI6MjEwMTQ3MDA1Nn0.SzWrwCRAttWEP30hehpzfiPpHXSHUvWXY_03X4Q8ZvM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
