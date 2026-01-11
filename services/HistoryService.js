import client from "../client.js";
import { Message } from "../models/Message.js";
import { LRUCache } from "lru-cache";

export class HistoryService {
    constructor() {
        this.cache = new LRUCache({
            max: 100,
            ttl: 1000 * 60 * 60,
            updateAgeOnGet: true,
            updateAgeOnHas: true,
        });
    }

    async getHistory(message) {
        const channel = client.channels.cache.get(message.channelId);
        let history = [message];
        try {
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
        } catch (err) {
            console.log("Error fetching message history:", err);
        }

        history.reverse();

        return history;
    }
}
