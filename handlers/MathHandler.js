import { evaluate } from "mathjs";

export class MathHandler {
    constructor(services) {}

    async handle(botMessage, state = null) {
        const expression = botMessage.getCleanContent().substring(1).trim();
        try {
            const result = await Promise.race([
                new Promise((resolve, reject) => {
                    try {
                        resolve(evaluate(expression));
                    } catch (err) {
                        reject(new Error(`EVAL_ERROR: ${err.message}`));
                    }
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("TIMEOUT_ERROR")), 1000)
                ),
            ]);

            let resultStr = String(result);
            if (typeof result === "function") {
                resultStr = "```js\n" + resultStr + "\n```";
            }

            if (resultStr.length > 2000) {
                return {
                    text: "Result too large!",
                    skipAI: true,
                    skipTyping: true,
                };
            }

            return { text: resultStr, skipAI: true, skipTyping: true };
        } catch (error) {
            if (error.message === "TIMEOUT_ERROR") {
                return {
                    text: "Calculation timeout!",
                    skipAI: true,
                    skipTyping: true,
                };
            } else if (error.message.startsWith("EVAL_ERROR:")) {
                const originalError = error.message.replace("EVAL_ERROR: ", "");
                return {
                    text: `Calculation error: ${originalError}`,
                    skipAI: true,
                    skipTyping: true,
                };
            } else {
                return {
                    text: `Unexpected error: ${error.message}`,
                    skipAI: true,
                    skipTyping: true,
                };
            }
        }
    }
}
