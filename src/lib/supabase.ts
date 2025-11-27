import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zjohneqzixghzawruuzy.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqb2huZXF6aXhnaHphd3J1dXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzY4ODMsImV4cCI6MjA3OTc1Mjg4M30.GTCzT4_xyjzIlTdzTjsLaAfvIyTUOk-WdG3uwNqMMkI"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);