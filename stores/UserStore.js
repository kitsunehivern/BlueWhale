export class UserStore {
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

    async getBalance(userId) {
        const [rows] = await this.db.execute(
            "SELECT balance FROM players WHERE user_id = ?",
            [userId]
        );
        return Number(rows[0]?.balance ?? 0);
    }

    async getRichestUsers(limit = 10) {
        const [rows] = await this.db.execute(
            "SELECT user_id, balance FROM players WHERE balance > 0 ORDER BY balance DESC LIMIT ?",
            [limit]
        );
        return rows.map((r) => ({ userId: r.user_id, balance: Number(r.balance) }));
    }

    async addBalance(userId, amount) {
        await this.db.execute(
            "INSERT INTO players (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id",
            [userId]
        );
        await this.db.execute(
            "UPDATE players SET balance = GREATEST(balance + ?, 0) WHERE user_id = ?",
            [amount, userId]
        );
        const [rows] = await this.db.execute(
            "SELECT balance FROM players WHERE user_id = ?",
            [userId]
        );
        return Number(rows[0].balance);
    }

    async giveBalance(fromUserId, toUserId, amount) {
        return this.withTransaction(async (conn) => {
            await conn.execute(
                "INSERT INTO players (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id",
                [fromUserId]
            );
            await conn.execute(
                "INSERT INTO players (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id",
                [toUserId]
            );

            const [first, second] = [fromUserId, toUserId].sort();
            await conn.execute("SELECT balance FROM players WHERE user_id = ? FOR UPDATE", [first]);
            await conn.execute("SELECT balance FROM players WHERE user_id = ? FOR UPDATE", [second]);

            const [[fromRow]] = await conn.execute(
                "SELECT balance FROM players WHERE user_id = ?",
                [fromUserId]
            );
            if (Number(fromRow.balance) < amount) throw new Error("INSUFFICIENT_BALANCE");

            await conn.execute(
                "UPDATE players SET balance = balance - ? WHERE user_id = ?",
                [amount, fromUserId]
            );
            await conn.execute(
                "UPDATE players SET balance = balance + ? WHERE user_id = ?",
                [amount, toUserId]
            );

            const [[newFrom]] = await conn.execute(
                "SELECT balance FROM players WHERE user_id = ?",
                [fromUserId]
            );
            const [[newTo]] = await conn.execute(
                "SELECT balance FROM players WHERE user_id = ?",
                [toUserId]
            );

            return { fromBalance: Number(newFrom.balance), toBalance: Number(newTo.balance) };
        });
    }

    async claimDailyBalance(userId, amount) {
        return this.withTransaction(async (conn) => {
            await conn.execute(
                "INSERT INTO players (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id",
                [userId]
            );

            const [[user]] = await conn.execute(
                "SELECT daily_claimed_at FROM players WHERE user_id = ? FOR UPDATE",
                [userId]
            );

            const lastClaimed = user.daily_claimed_at ? new Date(user.daily_claimed_at) : new Date(0);
            if (lastClaimed.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)) {
                throw new Error("DAILY_ALREADY_CLAIMED");
            }

            await conn.execute(
                "UPDATE players SET balance = GREATEST(balance + ?, 0), daily_claimed_at = UTC_TIMESTAMP() WHERE user_id = ?",
                [amount, userId]
            );

            const [[updated]] = await conn.execute(
                "SELECT balance FROM players WHERE user_id = ?",
                [userId]
            );
            return Number(updated.balance);
        });
    }
}
