// Supabase project connection.
// The anon/publishable key is intended for browser use; protect data with RLS.
// Never put a service_role key here.
const SUPABASE_URL = "https://kzbmofdyowliyjpccban.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_723QbivckLCJOVtutGTmzg_jhxPVAgX";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
