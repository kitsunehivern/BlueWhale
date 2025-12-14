import config from "../config.js";
import { createClient } from "@supabase/supabase-js";
import { UserBalanceStore } from "./UserBalanceStore.js";

export function newStores() {
    const supabase = createClient(config.supabase.url, config.supabase.apiKey, {
        auth: { persistSession: false },
    });

    const userBalanceStore = new UserBalanceStore(supabase);
    return {
        userBalanceStore,
    };
}
