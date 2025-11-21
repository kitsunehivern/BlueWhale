import { evaluate } from "mathjs";
import { Message } from "../models/Message.js";

export class MathHandler {
    constructor(services) {}

    async handle(botMessage, state = null) {
        const expression = botMessage.getCleanContent().substring(1).trim();
        let result = null;
        try {
            result = await Promise.race([
                new Promise((resolve, reject) => {
                    try {
                        resolve(evaluate(expression));
                    } catch (err) {
                        reject();
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(), 1000)),
            ]);

            if (typeof result === "function") {
                result = null;
            }
        } catch (error) {
            result = "Error evaluating expression";
        }

        return {
            message: new Message({ content: String(result) }),
            options: { skipTyping: true },
        };
    }
}
