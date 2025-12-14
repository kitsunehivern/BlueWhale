import { evaluate } from "mathjs";
import { Message } from "../../models/Message.js";

export class MathHandler {
    constructor(services) {}

    async handle(message) {
        const expression = message.getCleanContent().substring(1).trim();
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
        } catch (error) {}

        return result == null ? null : new Message({ content: String(result) });
    }
}
