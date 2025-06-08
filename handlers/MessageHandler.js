import { MessageClassifier } from "../services/MessageClassifier.js";
import { QuestionHandler } from "./QuestionHandler.js";
import { ReminderHandler } from "./ReminderHandler.js";
import { ChatHandler } from "./ChatHandler.js";
import { BotMessage } from "../models/BotMessage.js";
import { MessageUtils } from "../utils/MessageUtils.js";

export class MessageHandler {
    constructor(services) {
        this.classifier = new MessageClassifier(services);
        this.aiService = services.aiService;
        this.historyService = services.historyService;

        this.handlers = {
            question: new QuestionHandler(services),
            reminder: new ReminderHandler(services),
            chat: new ChatHandler(services),
        };
    }

    async handleMessage(discordMessage) {
        const botMessage = new BotMessage(discordMessage);
        try {
            await botMessage.loadImages();
            if (
                botMessage.content.includes(
                    botMessage.getBotMentionPattern(
                        discordMessage.client.user.id
                    )
                ) ||
                !this.historyService.hasHistory(botMessage.channelId)
            ) {
                this.historyService.initHistory(botMessage.channelId);
            }

            this.historyService.updateHistory(
                botMessage.channelId,
                botMessage.toAIFormat()
            );

            const intent = await this.classifier.classifyMessage(botMessage);
            console.log(`[${intent}] ${botMessage}`);

            const handler = this.handlers[intent] || this.handlers.chat;
            let prompt = await handler.handle(botMessage);

            if (prompt === null) {
                prompt =
                    "Tell that you're unavailable right now and cannot complete the action";
            }

            const chat = this.aiService.startChat({
                history: this.historyService.getHistory(botMessage.channelId)
                    .messages,
                // tools: [{ google_search: {} }],
            });

            const result = await chat.sendMessage(prompt);
            const response = result.response.text();

            this.historyService.updateHistory(botMessage.channelId, {
                role: "model",
                parts: [{ text: response }],
            });

            await this.sendResponse(botMessage, response);
        } catch (error) {
            console.error("Error handling message:", error);
            await this.sendResponse(
                botMessage,
                "Fuck you! Don't ever bother me again!"
            );
        }
    }

    async sendResponse(botMessage, response) {
        const responseChunks = MessageUtils.formatMessage(response);

        for (let i = 0; i < responseChunks.length; i++) {
            await botMessage.sendTyping();
            await MessageUtils.delay(
                Math.min(responseChunks[i].length * 10, 10000)
            );

            if (i === 0) {
                await botMessage.reply(responseChunks[i]);
            } else {
                await botMessage.send(responseChunks[i]);
            }
        }
    }
}
