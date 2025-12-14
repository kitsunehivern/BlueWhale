export class UserBalanceStore {
    constructor(supabase) {
        this.db = supabase;
        this.table = "user_balances";
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

        return BigInt(data?.balance ?? 0);
    }

    async adjustBalance(userId, delta) {
        const { data, error } = await this.db.rpc("adjust_balance", {
            p_user_id: userId,
            p_delta: Number(delta),
        });

        if (error) {
            throw error;
        }

        return BigInt(data);
    }

    async transferBalance(fromUserId, toUserId, amount) {
        const { data, error } = await this.db.rpc("transfer_balance", {
            p_from_user_id: fromUserId,
            p_to_user_id: toUserId,
            p_amount: Number(amount),
        });

        if (error) {
            throw error;
        }

        const row = data[0];
        return {
            fromBalance: BigInt(row.from_balance),
            toBalance: BigInt(row.to_balance),
        };
    }

    async stealBalance(thiefUserId, victimUserId) {
        const { data, error } = await this.db.rpc("steal_balance", {
            p_thief_user_id: thiefUserId,
            p_victim_user_id: victimUserId,
        });

        if (error) {
            throw error;
        }

        const row = data[0];
        return {
            stolenAmount: BigInt(row.stolen_amount),
            thiefBalance: BigInt(row.thief_balance),
            victimBalance: BigInt(row.victim_balance),
        };
    }

    async getRichestUsers(limit = 10) {
        const { data, error } = await this.db
            .from(this.table)
            .select("user_id, balance")
            .order("balance", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data.map((row) => ({
            userId: row.user_id,
            balance: BigInt(row.balance),
        }));
    }
}
