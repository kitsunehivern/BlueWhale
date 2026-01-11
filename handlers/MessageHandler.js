import { sprintf } from "sprintf-js";
import config from "../config.js";
import { error } from "../consts/error.js";
import { MessageClassifier } from "../services/MessageClassifier.js";
import { handleChat } from "./message/ChatHandler.js";
import { handleCalc } from "./command/CalcHandler.js";
import { handleBalance } from "./command/BalanceHandler.js";
import { handleBaucua } from "./command/BaucuaHandler.js";
import { handleAdd } from "./command/AddHandler.js";
import { handleDaily } from "./command/DailyHandler.js";
import { handlePlace } from "./command/PlaceHandler.js";
import { handleRich } from "./command/RichHandler.js";
import { handleGive } from "./command/GiveHandler.js";
import { handleStats } from "./command/StatsHandler.js";

export class MessageHandler {
    constructor(services) {
        this.classifier = new MessageClassifier(services);
        this.services = services;

        this.messageHandlers = {
            chat: handleChat,
        };
        this.commandHandlers = {
            calc: handleCalc,
            balance: handleBalance,
            baucua: handleBaucua,
            add: handleAdd,
            daily: handleDaily,
            place: handlePlace,
            rich: handleRich,
            give: handleGive,
            stats: handleStats,
        };
    }

    async handle(message) {
        await message.loadEmbeddings();
        if (message.isCommand()) {
            await this.#handleCommand(message);
        } else {
            await this.#handleMessage(message);
        }
    }

    async #handleMessage(message) {
        const category = await this.classifier.classifyMessage(message);
        message.messageName = category;

        console.log(message.preview());

        const handler = this.messageHandlers[category];
        if (!handler) {
            console.log(`No handler for category: ${category}`);
            return;
        }

        try {
            await handler(message, this.services);
        } catch (error) {
            console.log("Error handling message:", error);
        }
    }

    async #handleCommand(message) {
        try {
            if (message.args.length === 0) {
                return;
            }

            const handler = this.commandHandlers[message.messageName];
            if (!handler) {
                console.log(`No handler for command: ${message.messageName}`);
                return;
            }

            console.log(message.preview());

            await handler(message, this.services, message.args.slice(1));
        } catch (error) {
            console.log("Error handling command:", error);
        }
    }
}
