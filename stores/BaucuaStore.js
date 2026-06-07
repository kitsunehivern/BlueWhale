export class BaucuaStore {
    constructor(db) {
        this.db = db;
    }

    async withTransaction(fn) {
        const conn = await this.db.getConnection();
        try {
            await conn.beginTransaction();
            const result = await fn(conn);
            await conn.commit();
            return result;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async findGame(gameId) {
        const [rows] = await this.db.execute(
            "SELECT * FROM baucua_games WHERE id = ?",
            [gameId]
        );
        return rows[0] ?? null;
    }

    async findActiveGameByChannel(channelId) {
        const [rows] = await this.db.execute(
            "SELECT * FROM baucua_games WHERE channel_id = ? AND status = 'active'",
            [channelId]
        );
        return rows[0] ?? null;
    }

    async findActiveGames() {
        const [rows] = await this.db.execute(
            "SELECT * FROM baucua_games WHERE status = 'active'"
        );
        return rows;
    }

    async findBets(gameId, conn = null) {
        const db = conn ?? this.db;
        const [rows] = await db.execute(
            "SELECT * FROM baucua_bets WHERE game_id = ? ORDER BY created_at ASC",
            [gameId]
        );
        return rows;
    }

    async findBetTotalsByUser(gameId, conn = null) {
        const db = conn ?? this.db;
        const [rows] = await db.execute(
            "SELECT user_id, SUM(amount) AS total FROM baucua_bets WHERE game_id = ? GROUP BY user_id",
            [gameId]
        );
        return rows;
    }

    async queryStats() {
        const [[gamesRow]] = await this.db.execute(
            "SELECT COUNT(*) AS games FROM baucua_games WHERE status = 'settled'"
        );
        const [[betsRow]] = await this.db.execute(
            "SELECT COUNT(*) AS bets FROM baucua_bets b JOIN baucua_games g ON g.id = b.game_id WHERE g.status = 'settled'"
        );
        const [diceRows] = await this.db.execute(
            "SELECT dices FROM baucua_games WHERE status = 'settled' AND dices IS NOT NULL"
        );
        return { gamesRow, betsRow, diceRows };
    }

    async lockGame(gameId, conn) {
        const [[game]] = await conn.execute(
            "SELECT * FROM baucua_games WHERE id = ? FOR UPDATE",
            [gameId]
        );
        return game ?? null;
    }

    async lockPlayerBalance(userId, conn) {
        const [[player]] = await conn.execute(
            "SELECT balance FROM players WHERE user_id = ? FOR UPDATE",
            [userId]
        );
        return player ?? null;
    }

    async createGame(channelId, startedBy, durationSeconds) {
        const [existing] = await this.db.execute(
            "SELECT id FROM baucua_games WHERE channel_id = ? AND status = 'active'",
            [channelId]
        );
        if (existing.length > 0) throw new Error("BAUCUA_ALREADY_RUNNING");

        const [result] = await this.db.execute(
            "INSERT INTO baucua_games (channel_id, started_by, ends_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))",
            [channelId, startedBy, durationSeconds]
        );
        return result.insertId;
    }

    async setGameMessage(gameId, messageId) {
        await this.db.execute(
            "UPDATE baucua_games SET message_id = ? WHERE id = ?",
            [messageId, gameId]
        );
    }

    async ensurePlayer(userId, conn) {
        await conn.execute(
            "INSERT INTO players (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id",
            [userId]
        );
    }

    async insertBet(gameId, userId, symbol, amount, conn) {
        await conn.execute(
            "INSERT INTO baucua_bets (game_id, user_id, symbol, amount) VALUES (?, ?, ?, ?)",
            [gameId, userId, symbol, amount]
        );
    }

    async debitPlayer(userId, amount, conn) {
        await conn.execute(
            "UPDATE players SET balance = balance - ? WHERE user_id = ?",
            [amount, userId]
        );
    }

    async creditPlayer(userId, amount, conn) {
        await conn.execute(
            "UPDATE players SET balance = balance + ? WHERE user_id = ?",
            [amount, userId]
        );
    }

    async markSettled(gameId, dices, conn) {
        await conn.execute(
            "UPDATE baucua_games SET status = 'settled', dices = ?, settled_at = UTC_TIMESTAMP() WHERE id = ?",
            [JSON.stringify(dices), gameId]
        );
    }

    async markRefunded(gameId, conn) {
        await conn.execute(
            "UPDATE baucua_games SET status = 'refunded', refunded_at = UTC_TIMESTAMP() WHERE id = ?",
            [gameId]
        );
    }
}
