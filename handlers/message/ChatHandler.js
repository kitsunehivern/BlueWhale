import { re } from "mathjs";

export class ChatHandler {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
    }

    async handle(message) {
        const history = await this.historyService.getHistory(message);
        const response = await this.chatService.respond(history);
        return response;
    }
}
