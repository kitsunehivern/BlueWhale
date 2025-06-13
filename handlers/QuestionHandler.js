export class QuestionHandler {
    constructor(services) {
        this.aiService = services.aiService;
        this.historyService = services.historyService;
    }

    async handle(botMessage) {
        const searchResult = await this.getInformation(botMessage);

        const prompt = `
Answer the following question based on the conversation history and any relevant information provided. If there is an error, return the error message. Question: ${botMessage.getCleanContent()}\n${searchResult}`;

        return prompt;
    }

    async getInformation(botMessage) {
        const prompt = `Search for relevant information to answer this question. Return only factual information: "${botMessage.getCleanContent()}"`;

        const attachmentParts = botMessage.getAttachments().map((img) => ({
            inlineData: {
                data: img.data,
                mimeType: img.type,
            },
        }));

        const linksParts = botMessage.getLinks().map((link) => ({
            fileData: {
                fileUri: link.url,
                mimeType: link.type,
            },
        }));

        try {
            const contents = [
                ...this.historyService.getHistory(botMessage.channelId)
                    .messages,
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        ...attachmentParts,
                        ...linksParts,
                    ],
                },
            ];

            const result = await this.aiService.generateContent({
                contents: contents,
                tools: [{ google_search: {} }],
            });

            return "Relevant information: " + result.response.text();
        } catch (error) {
            console.error("Error getting information:", error);
            const match = error.message.match(/\[400 Bad Request\] (.+?)$/);
            const message = match
                ? match[1]
                : "An error occurred while fetching information";
            return "Error: " + message;
        }
    }
}
