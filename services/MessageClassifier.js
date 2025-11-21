export class MessageClassifier {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
    }

    async classifyMessage(botMessage) {
        let result = await this.#fastClassify(botMessage);
        if (result === null) {
            result = await this.#aiClassify(botMessage);
        }

        return result;
    }

    async #fastClassify(botMessage) {
        const text = botMessage.getCleanContent().toLowerCase();
        if (text.startsWith("=")) {
            return "math";
        }

        return null;
    }

    async #aiClassify(botMessage) {
        return "chat";
    }
}
