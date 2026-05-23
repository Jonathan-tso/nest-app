// Supabase client. Fill in your project URL + anon key.
//
// 1) Go to https://supabase.com and create a free project.
// 2) Run supabase/migration.sql in the SQL editor.
// 3) Auth → providers → email: turn "Confirm email" OFF for the MVP.
// 4) Paste the project URL and anon public key below.

const SUPABASE_URL = "https://jjuyhvurxdnsnebdxylq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1qwL2VHRzW8aNUHugoo8RA_nv7K1V6f";

const isConfigured =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY.length > 30 &&
  typeof window.supabase !== "undefined";

const supabaseClient = isConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

Object.assign(window, { supabaseClient, supabaseIsConfigured: isConfigured });
