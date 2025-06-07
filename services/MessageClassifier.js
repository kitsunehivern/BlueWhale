export class MessageClassifier {
    constructor(services) {
        this.aiService = services.aiService;
        this.historyService = services.historyService;
    }

    async classifyMessage(botMessage) {
        return await this.aiClassify(botMessage);
    }

    async aiClassify(botMessage) {
        try {
            const prompt = `
Classify the following message into one of these categories:
- "question": Asking for information, explanations, or answers
- "reminder": Setting up reminders, scheduling notifications, or time-based alerts
- "chat": General conversation, greetings, casual talk, or expressions

Message: "${botMessage.content}"

Respond with only the category name (question, reminder, or chat).
            `;

            const parts = [
                { text: prompt },
                ...botMessage.images.map((img) => ({
                    inlineData: {
                        data: img.data,
                        mimeType: img.type,
                    },
                })),
            ];

            const result = await this.aiService.generateContent({
                contents: [
                    this.historyService.getHistory(botMessage.channelId)
                        .messsages,
                    { role: "user", parts: parts },
                ],
            });

            const classification = result.response.text().trim().toLowerCase();

            if (["question", "reminder", "chat"].includes(classification)) {
                return classification;
            }

            return "chat";
        } catch (error) {
            console.error("Error in AI classification:", error);
            return "chat";
        }
    }
}
