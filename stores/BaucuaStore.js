export class BaucuaStore {
    constructor(supabase) {
        this.db = supabase;
        this.gamesTable = "baucua_games";
        this.betsTable = "baucua_bets";
    }

    async startGame(channelId, startedBy, durationSeconds) {
        const { data, error } = await this.db.rpc("start_baucua_game", {
            p_channel_id: channelId,
            p_started_by: startedBy,
            p_duration_seconds: durationSeconds,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    async setGameMessage(gameId, messageId) {
        const { data, error } = await this.db.rpc("set_baucua_game_message", {
            p_game_id: gameId,
            p_message_id: messageId,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    async getGame(gameId) {
        const { data, error } = await this.db
            .from(this.gamesTable)
            .select("*")
            .eq("id", gameId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    }

    async getActiveGameByChannel(channelId) {
        const { data, error } = await this.db
            .from(this.gamesTable)
            .select("*")
            .eq("channel_id", channelId)
            .eq("status", "active")
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    }

    async listActiveGames() {
        const { data, error } = await this.db
            .from(this.gamesTable)
            .select("*")
            .eq("status", "active");

        if (error) {
            throw error;
        }

        return data;
    }

    async listBets(gameId) {
        const { data, error } = await this.db
            .from(this.betsTable)
            .select("*")
            .eq("game_id", gameId)
            .order("created_at", { ascending: true });

        if (error) {
            throw error;
        }

        return data;
    }

    async placeBet(gameId, userId, symbol, amount) {
        const { data, error } = await this.db.rpc("place_baucua_bet", {
            p_game_id: gameId,
            p_user_id: userId,
            p_symbol: symbol,
            p_amount: amount,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    async settleGame(gameId, dices) {
        const { data, error } = await this.db.rpc("settle_baucua_game", {
            p_game_id: gameId,
            p_dices: dices,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    async refundGame(gameId) {
        const { data, error } = await this.db.rpc("refund_baucua_game", {
            p_game_id: gameId,
        });

        if (error) {
            throw error;
        }

        return data;
    }
}
