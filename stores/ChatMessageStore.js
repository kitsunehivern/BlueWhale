import { LRUCache } from "lru-cache";
import attachmentCache from "./AttachmentCache.js";

export class ChatMessageStore {
    constructor(db) {
        this.db = db;
        this.cache = new LRUCache({
            max: 500,
            ttl: 1000 * 60 * 60,
            updateAgeOnGet: true,
            updateAgeOnHas: true,
        });
    }

    async get(messageId) {
        if (this.cache.has(messageId)) return this.cache.get(messageId);

        const [rows] = await this.db.execute(
            "SELECT message_id, user_id, channel_id, text, ref_message_id FROM chat_messages WHERE message_id = ?",
            [messageId]
        );
        const data = rows[0] ?? null;
        if (data) this.cache.set(messageId, data);
        return data;
    }

    async save(messageId, userId, channelId, text, refMessageId = null) {
        const record = { message_id: messageId, user_id: userId, channel_id: channelId, text, ref_message_id: refMessageId };
        await this.db.execute(
            `INSERT INTO chat_messages (message_id, user_id, channel_id, text, ref_message_id) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), channel_id = VALUES(channel_id), text = VALUES(text), ref_message_id = VALUES(ref_message_id)`,
            [messageId, userId, channelId, text, refMessageId]
        );
        this.cache.set(messageId, record);
    }

    async getChain(messageId, botId) {
        const chain = [];
        let current = messageId;

        while (current) {
            const record = await this.get(current);
            if (!record) break;

            const parts = [{ text: record.text }];
            const attParts = await attachmentCache.getOrFetch(current, record.channel_id);
            if (attParts) parts.push(...attParts);

            chain.push({
                role: record.user_id === botId ? "model" : "user",
                parts,
            });
            current = record.ref_message_id;
        }

        chain.reverse();
        return chain;
    }
}
