export class QuestionHandler {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
    }

    async handle(botMessage, state = null) {
        const searchResult = await this.#getInformation(botMessage);

        const prompt = `
Respond to the following message based on the conversation history and any relevant information provided. If there is an error, return the error message. Message: ${botMessage.getCleanContent()}\n${searchResult}`;

        return { text: prompt };
    }

    async #getInformation(botMessage) {
        const prompt = `Search for relevant information to answer this message. Return only factual information: "${botMessage.getCleanContent()}"`;

        try {
            const contents = [
                await this.historyService.getHistory(
                    botMessage.channelId,
                    botMessage.id
                ),
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        ...botMessage.getAIAttachments(),
                        ...botMessage.getAILinks(),
                    ],
                },
            ];

            const result = await this.chatService.generateContent({
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
