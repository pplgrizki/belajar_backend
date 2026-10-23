import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gdxuuuatppwahjznqdgz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkeHV1dWF0cHB3YWhqem5xZGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzkyNDEsImV4cCI6MjEwNjE1NTI0MX0.NXS8twbaI6Iir-F-SgwRwaDvELCzGAieuaWEhp62s0s";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);