export class MessageClassifier {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
    }

    async classifyMessage(message) {
        let result = await this.#fastClassify(message);
        if (result === null) {
            result = await this.#aiClassify(message);
        }

        return result;
    }

    async #fastClassify(message) {
        return null;
    }

    async #aiClassify(message) {
        return "chat";
    }
}
