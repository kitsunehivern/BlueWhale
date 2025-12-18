export class UserStore {
    constructor(supabase) {
        this.db = supabase;
        this.table = "users";
    }

    async getBalance(userId) {
        const { data, error } = await this.db
            .from(this.table)
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data?.balance ?? 0;
    }

    async addBalance(userId, amount) {
        const { data, error } = await this.db.rpc("add_balance", {
            p_user_id: userId,
            p_amount: amount,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    async giveBalance(fromUserId, toUserId, amount) {
        const { data, error } = await this.db.rpc("give_balance", {
            p_from_user_id: fromUserId,
            p_to_user_id: toUserId,
            p_amount: amount,
        });

        if (error) {
            throw error;
        }

        const row = data[0];
        return {
            fromBalance: row.from_balance,
            toBalance: row.to_balance,
        };
    }

    async getRichestUsers(limit = 10) {
        const { data, error } = await this.db
            .from(this.table)
            .select("user_id, balance")
            .gt("balance", 0)
            .order("balance", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data.map((row) => ({
            userId: row.user_id,
            balance: row.balance,
        }));
    }

    async claimDailyBalance(userId, amount) {
        const { data, error } = await this.db.rpc("daily_balance", {
            p_user_id: userId,
            p_amount: amount,
        });

        if (error) {
            throw error;
        }

        return data;
    }
}
