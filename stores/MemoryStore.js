export class MemoryStore {
    constructor(db) {
        this.db = db;
    }

    async findByUser(userId) {
        const [rows] = await this.db.execute(
            "SELECT fact FROM user_memories WHERE user_id = ? ORDER BY created_at ASC",
            [userId]
        );
        return rows.map((r) => r.fact);
    }

    async addFacts(userId, facts) {
        if (!facts.length) return;

        const conn = await this.db.getConnection();
        try {
            await conn.beginTransaction();

            for (const fact of facts) {
                await conn.execute(
                    "INSERT INTO user_memories (user_id, fact) VALUES (?, ?)",
                    [userId, fact]
                );
            }

            const [[{ cnt }]] = await conn.execute(
                "SELECT COUNT(*) AS cnt FROM user_memories WHERE user_id = ?",
                [userId]
            );
            if (cnt > 25) {
                await conn.execute(
                    "DELETE FROM user_memories WHERE user_id = ? ORDER BY created_at ASC LIMIT ?",
                    [userId, cnt - 25]
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
