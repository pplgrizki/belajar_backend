
import { supabase } from "./supabase-client.js";

async function checkLogin() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        window.location.replace("login.html");
        return;
    }
}

checkLogin();
