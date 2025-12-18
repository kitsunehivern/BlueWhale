import config from "../config.js";
import { createClient } from "@supabase/supabase-js";
import { UserStore } from "./UserStore.js";
import { BaucuaStore } from "./BaucuaStore.js";

export function newStores() {
    const supabase = createClient(config.supabase.url, config.supabase.apiKey, {
        auth: { persistSession: false },
    });

    const userStore = new UserStore(supabase);
    const baucuaStore = new BaucuaStore(supabase);
    return {
        userStore,
        baucuaStore,
    };
}
