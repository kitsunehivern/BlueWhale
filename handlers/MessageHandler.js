import { MessageClassifier } from "../services/MessageClassifier.js";
import { ChatHandler } from "./ChatHandler.js";
import { MathHandler } from "./MathHandler.js";
import { MessageUtils } from "../utils/MessageUtils.js";
import { or } from "mathjs";

export class MessageHandler {
    constructor(services) {
        this.classifier = new MessageClassifier(services);
        this.chatService = services.chatService;
        this.historyService = services.historyService;

        this.handlers = {
            chat: new ChatHandler(services),
            math: new MathHandler(services),
        };
    }

    async handle(message) {
        await message.loadEmbeddings();
        const category = await this.classifier.classifyMessage(message);
        console.log(`[${category}] ${message.preview()}`);

        const handler = this.handlers[category];
        if (!handler) {
            console.error(`No handler for category: ${category}`);
            return;
        }

        try {
            const response = await handler.handle(message);
            if (response) {
                await this.sendResponse(message, response);
            }
        } catch (error) {
            console.error("Error handling message", error);
        }
    }

    async sendResponse(originalMessage, responseMessage) {
        const responseChunks = MessageUtils.formatMessage(
            responseMessage.getCleanContent()
        );

        let lastMessage = originalMessage;
        for (let i = 0; i < responseChunks.length; i++) {
            await originalMessage.sendTyping();
            await MessageUtils.delay(
                Math.min(responseChunks[i].length * 10, 10000)
            );

            lastMessage = await lastMessage.reply(responseChunks[i]);
        }
    }
}
