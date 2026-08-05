import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env — check your setup.",
  );
}

// The backend uses the SERVICE ROLE key, not the anon key.
// This bypasses Row Level Security, which is fine here because our own
// middleware (see auth.middleware.js) is responsible for checking that a
// request is allowed to touch a given row before any service function runs.
export const createSupabaseClient = () =>
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

const supabase = createSupabaseClient();
export default supabase;
