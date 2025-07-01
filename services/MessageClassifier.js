export class MessageClassifier {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
    }

    async classifyMessage(botMessage) {
        return await this.#aiClassify(botMessage);
    }

    async #aiClassify(botMessage) {
        for (let i = 0; i < 3; i++) {
            try {
                const prompt = `
    Classify the following message into one of these categories:
    - "question": Asking for information, explanations, or answers
    - "image": Find images based on the message content
    - "reminder": Setting up or canceling reminders, scheduling notifications, or time-based alerts
    - "register": Registering or unregistering for a LeetCode Daily Challenge
    - "chat": General conversation, greetings, casual talk, or expressions

    Message: "${botMessage.content}"

    Respond with only the category name (question, image, reminder, register or chat).
                `;

                const result = await this.chatService.generateContent({
                    contents: [
                        this.historyService.getHistory(botMessage.channelId)
                            .messsages,
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
                    [
                        "question",
                        "image",
                        "reminder",
                        "register",
                        "chat",
                    ].includes(classification)
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
