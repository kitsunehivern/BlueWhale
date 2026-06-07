import client from "../client.js";

export class HistoryService {
    constructor(chatMessageStore) {
        this.store = chatMessageStore;
    }

    async getHistory(refMessageId) {
        if (!refMessageId) return [];
        try {
            return await this.store.getChain(refMessageId, client.user.id);
        } catch (err) {
            console.log("Error fetching chat history:", err);
            return [];
        }
    }

    async saveMessage(messageId, userId, channelId, text, refMessageId = null) {
        try {
            await this.store.save(messageId, userId, channelId, text, refMessageId);
        } catch (err) {
            console.log("Error saving chat message:", err);
        }
    }
}
