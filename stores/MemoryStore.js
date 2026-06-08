export class MemoryStore {
    constructor(db) {
        this.db = db;
    }

    async findByUser(userId) {
        const [rows] = await this.db.execute(
            "SELECT fact FROM user_memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
            [userId]
        );
        return rows.map((r) => r.fact);
    }

    async getActiveCount(userId) {
        const [[{ cnt }]] = await this.db.execute(
            "SELECT COUNT(*) AS cnt FROM user_memories WHERE user_id = ? AND deleted_at IS NULL",
            [userId]
        );
        return cnt;
    }

    async addFacts(userId, facts) {
        if (!facts.length) return;
        for (const fact of facts) {
            await this.db.execute(
                "INSERT INTO user_memories (user_id, fact) VALUES (?, ?)",
                [userId, fact]
            );
        }
    }

    async compress(userId, summaryFacts) {
        const conn = await this.db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute(
                "UPDATE user_memories SET deleted_at = UTC_TIMESTAMP() WHERE user_id = ? AND deleted_at IS NULL",
                [userId]
            );
            for (const fact of summaryFacts) {
                await conn.execute(
                    "INSERT INTO user_memories (user_id, fact) VALUES (?, ?)",
                    [userId, fact]
                );
            }
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}
