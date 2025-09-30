import { MessageClassifier } from "../services/MessageClassifier.js";
import { QuestionHandler } from "./QuestionHandler.js";
import { ImageHandler } from "./ImageHandler.js";
import { ReminderHandler } from "./ReminderHandler.js";
import { RegisterHandler } from "./RegisterHandler.js";
import { ChatHandler } from "./ChatHandler.js";
import { MathHandler } from "./MathHandler.js";
import { BotMessage } from "../models/BotMessage.js";
import { MessageUtils } from "../utils/MessageUtils.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";

export class MessageHandler {
    constructor(services) {
        this.classifier = new MessageClassifier(services);
        this.chatService = services.chatService;
        this.historyService = services.historyService;

        this.handlers = {
            question: new QuestionHandler(services),
            image: new ImageHandler(services),
            reminder: new ReminderHandler(services),
            register: new RegisterHandler(services),
            chat: new ChatHandler(services),
            math: new MathHandler(services),
        };
    }

    async handleMessage(discordMessage) {
        const botMessage = new BotMessage(discordMessage);
        try {
            await botMessage.loadAttachments();
            botMessage.loadLinks();

            const intent = await this.classifier.classifyMessage(botMessage);
            console.log(`[${intent}] ${botMessage}`);

            let state = null;
            while (true) {
                let result = null;
                if (intent === "none") {
                    result = {
                        text: "You tell the user that you cannot do the requested action",
                    };
                } else {
                    const handler = this.handlers[intent] || this.handlers.chat;
                    result = await handler.handle(botMessage, state);
                }

                if (result === null || result.text.trim() === "") {
                    result = {
                        text: "You tell the user that you're unavailable right now and cannot complete the action",
                    };
                }

                let responseText;
                if (result.skipAI) {
                    responseText = result.text;
                } else {
                    const chat = this.chatService.startChat({
                        history: await this.historyService.getHistory(
                            botMessage.channelId,
                            botMessage.id
                        ),
                    });

                    const response = await chat.sendMessage(result.text);
                    responseText = response.response.text();
                }

                const responseImages = result.images;
                const skipTyping = result.skipTyping || false;

                await this.sendResponse(
                    botMessage,
                    responseText,
                    responseImages,
                    skipTyping
                );

                if (result.state) {
                    state = result.state;
                } else {
                    break;
                }

                if (result.delay) {
                    await MessageUtils.delay(result.delay);
                }
            }
        } catch (error) {
            console.error("Error handling message:", error);
            await this.sendResponse(
                botMessage,
                "Fuck you! Don't ever bother me again!",
                undefined,
                true
            );
        }
    }

    async sendResponse(
        botMessage,
        response,
        attachments = undefined,
        skipTyping = false
    ) {
        const responseChunks = MessageUtils.formatMessage(response);
        const discordAttachments = attachments
            ? await Promise.all(
                  attachments.map(async (att, i) => {
                      const maxSize = 800;

                      const metadata = await sharp(att.data).metadata();
                      const { width, height } = metadata;

                      const scale = Math.min(
                          maxSize / width,
                          maxSize / height,
                          1
                      );
                      const newWidth = Math.round(width * scale);
                      const newHeight = Math.round(height * scale);

                      const resizedBuffer = await sharp(att.data)
                          .resize(newWidth, newHeight)
                          .toBuffer();
                      return new AttachmentBuilder(resizedBuffer, {
                          name: `image.png`,
                      });
                  })
              )
            : undefined;

        for (let i = 0; i < responseChunks.length; i++) {
            if (!skipTyping) {
                await botMessage.sendTyping();
                await MessageUtils.delay(
                    Math.min(responseChunks[i].length * 10, 10000)
                );
            }

            const sendOptions =
                i === responseChunks.length - 1 && discordAttachments
                    ? { files: discordAttachments }
                    : undefined;

            if (i === 0) {
                await botMessage.reply(responseChunks[i], sendOptions);
            } else {
                await botMessage.send(responseChunks[i], sendOptions);
            }
        }
    }
}
