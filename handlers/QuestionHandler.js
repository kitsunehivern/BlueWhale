export class QuestionHandler {
    constructor(services) {
        this.aiService = services.aiService;
        this.historyService = services.historyService;
    }

    async handle(botMessage) {
        const searchResult = await this.getInformation(botMessage);

        const prompt = `
Answer the following question based on the conversation history and any relevant information provided.
Question: ${botMessage.getCleanContent()}
${searchResult ? `\nRelevant information: ${searchResult}` : ""}
        `;

        return prompt;
    }

    async getInformation(botMessage) {
        try {
            const contents = [
                ...this.historyService.getHistory(botMessage.channelId)
                    .messages,
                {
                    role: "user",
                    parts: [
                        {
                            text: `Search for relevant information to answer this question. Return only factual information: "${botMessage.getCleanContent()}"`,
                        },
                        ...botMessage.getImages().map((img) => ({
                            inlineData: {
                                data: img.data,
                                mimeType: img.type,
                            },
                        })),
                    ],
                },
            ];

            const result = await this.aiService.generateContent({
                contents: contents,
                tools: [{ google_search: {} }],
            });

            return result.response.text();
        } catch (error) {
            console.error("Error getting information:", error);
            return null;
        }
    }
}
