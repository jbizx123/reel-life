/**
 * Typed Supabase database helper.
 * The generated types file has empty tables (backend tables not yet reflected).
 * This helper casts the client to `any` so we can use table names freely
 * until the types are regenerated after the backend creates the tables.
 */
import { supabase } from '@/app/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;
