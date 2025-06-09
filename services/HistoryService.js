export class HistoryService {
    constructor(personas) {
        this.histories = new Map();
        this.personas = personas;
    }

    initHistory(channelId) {
        let history = this.histories.get(channelId);

        if (history) {
            history.messages = [];
        } else {
            history = { messages: [], timeout: null };
            this.histories.set(channelId, history);
        }

        history.messages.push({
            role: "user",
            parts: [{ text: this.personas["Hoshino"] }],
        });
    }

    updateHistory(channelId, message) {
        const history = this.histories.get(channelId);
        if (!history) {
            this.initHistory(channelId);
            return;
        }

        clearTimeout(history.timeout);
        history.messages.push(message);

        history.timeout = setTimeout(() => {
            this.histories.delete(channelId);
        }, 86_400_000);
    }

    getHistory(channelId) {
        return this.histories.get(channelId) || { messages: [] };
    }

    hasHistory(channelId) {
        return this.histories.has(channelId);
    }
}
