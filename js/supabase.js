// Supabase project connection.
// This anon key is intended for browser use; database access must be protected by RLS.
const SUPABASE_URL = "https://kzbmofdyowliyjpccban.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Ym1vZmR5b3dsaXJqcGNjYmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MzI2OTcsImV4cCI6MjEwODEwODY5N30.S8185pBvzC_I3nKaHn-leH2oAzXE1ig2wwyj15lp85M";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
