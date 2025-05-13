import { createClient } from "@supabase/supabase-js";

// ✅ Environment Variables for Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Error Handling for Missing Environment Variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Supabase environment variables are missing.");
  throw new Error("Supabase environment variables are not set.");
}

// ✅ Initialize Supabase Client with Enhanced Configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,          
    autoRefreshToken: true,     
    detectSessionInUrl: true,    
    storage: localStorage,    
  },
});

// ✅ Expose Supabase Client for Debugging (only in development)
if (typeof window !== "undefined" && import.meta.env.MODE === "development") {
  window.supabase = supabase;
  console.log("✅ Supabase Client Exposed for Debugging:", supabase);
}
