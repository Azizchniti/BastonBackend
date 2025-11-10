import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ✅ Public client (limited access)
export const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ✅ Secure service client (full access)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
