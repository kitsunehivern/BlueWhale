import client from "../index.js";
import { Message } from "../models/Message.js";
import { LRUCache } from "lru-cache";

const options = {
    max: 100,
    ttl: 1000 * 60 * 60,
    allowStale: false,
    updateAgeOnGet: true,
    updateAgeOnHas: true,
};

export class HistoryService {
    constructor() {
        this.cache = new LRUCache(options);
    }

    async getHistory(message) {
        const channel = client.channels.cache.get(message.channelId);
        let history = [message];
        while (message.referenceId != undefined) {
            if (!this.cache.has(message.referenceId)) {
                const refMessage = await channel.messages.fetch(
                    message.referenceId
                );

                const newMessage = new Message(refMessage);
                await newMessage.loadEmbeddings();
                this.cache.set(message.referenceId, newMessage);
            }

            message = this.cache.get(message.referenceId);
            history.push(message);
        }

        history.reverse();

        return history;
    }
}
