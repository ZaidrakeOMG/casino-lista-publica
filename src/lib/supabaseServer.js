import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Falta SUPABASE_URL en .env");
}

if (!serviceRoleKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env");
}

console.log("SUPABASE SERVER KEY:", serviceRoleKey.startsWith("sb_secret_") ? "sb_secret OK" : "NO ES SB_SECRET");

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`
    }
  }
});