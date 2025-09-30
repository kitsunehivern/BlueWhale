export class MessageClassifier {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
    }

    async classifyMessage(botMessage) {
        let result = this.#fastClassify(botMessage);
        if (result === null) {
            result = await this.#aiClassify(botMessage);
        }

        return result;
    }

    #fastClassify(botMessage) {
        const text = botMessage.getCleanContent().toLowerCase();
        if (text.startsWith("=")) {
            return "math";
        }

        return null;
    }

    async #aiClassify(botMessage) {
        for (let i = 0; i < 3; i++) {
            try {
                const prompt = `
    Classify the following message into one of these categories:
    - "question": Asking for summarization, information, explanations, or answers
    - "reminder": Setting up or canceling reminders, scheduling notifications, or time-based alerts
    - "register": Registering or unregistering for a LeetCode Daily Challenge
    - "chat": General conversation, greetings, casual talk, or expressions

    Message: "${botMessage.getCleanContent()}"

    Respond with only the category name (question, reminder, register, chat).
                `;

                const result = await this.chatService.generateContent({
                    contents: [
                        await this.historyService.getHistory(
                            botMessage.channelId,
                            botMessage.id
                        ),
                        {
                            role: "user",
                            parts: [{ text: prompt }],
                        },
                    ],
                });

                const classification = result.response
                    .text()
                    .trim()
                    .toLowerCase();

                if (
                    ["question", "reminder", "register", "chat"].includes(
                        classification
                    )
                ) {
                    return classification;
                }
            } catch (error) {
                console.error("Error in AI classification:", error);
            }
        }

        return "chat";
    }
}
