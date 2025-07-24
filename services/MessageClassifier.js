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
    - "reminder": Setting up or canceling reminders, scheduling notifications, or time-based alerts
    - "register": Registering or unregistering for a LeetCode Daily Challenge
    - "chat": General conversation, greetings, casual talk, or expressions
    - "none": If the message does not fit any of the above categories

    Message: "${botMessage.content}"

    Respond with only the category name (question, reminder, register, chat, or none).
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
                    [
                        "question",
                        "reminder",
                        "register",
                        "chat",
                        "none",
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
