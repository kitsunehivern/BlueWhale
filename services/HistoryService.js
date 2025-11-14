import client from "../index.js";
import { BotMessage } from "../models/BotMessage.js";
import { LRUCache } from "lru-cache";

const options = {
    max: 100,
    ttl: 1000 * 60 * 60,
    allowStale: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
};

const MAX_HISTORY_DEPTH = 10;

export class HistoryService {
    constructor(personas) {
        this.personas = personas;
        this.cache = new LRUCache(options);
    }

    async getHistory(channelId, messageId) {
        const channel = client.channels.cache.get(channelId);
        let message = new BotMessage(
            client.channels.cache.get(channelId).messages.cache.get(messageId)
        );
        let history = [];
        for (
            let i = 0;
            i < MAX_HISTORY_DEPTH && message.referenceId !== null;
            i++
        ) {
            if (!this.cache.has(message.referenceId)) {
                this.cache.set(
                    message.referenceId,
                    new BotMessage(
                        await channel.messages.fetch(message.referenceId)
                    )
                );
            }

            message = this.cache.get(message.referenceId);
            history.push(message.getAIFormat());
        }

        history.push({
            role: "user",
            parts: [{ text: this.personas["Hoshino"] }],
        });

        history.reverse();

        return history;
    }
}
