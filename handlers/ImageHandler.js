export class ImageHandler {
    constructor(services) {
        this.chatService = services.chatService;
        this.imageService = services.imageService;
        this.searchService = services.searchService;
        this.historyService = services.historyService;
    }

    async handle(botMessage, state = null) {
        try {
            const searchQuery = await this.extractSearchQuery(botMessage);
            console.log(`Query extracted: ${searchQuery}`);

            if (searchQuery == null) {
                return null;
            }

            const referenceImages = searchQuery
                ? await this.searchService.searchImages(searchQuery)
                : [];

            return {
                text: `Respond to the message that you found some images about this query: ${searchQuery}`,
                images: referenceImages.map((img) => img.data),
            };

            // const referenceAIImages = referenceImages.map((img) => ({
            //     inlineData: {
            //         data: img.data,
            //         mimeType: img.type,
            //     },
            // }));

            // const prompt = `Generate an image based on the conversation history and the following message: "${botMessage.getCleanContent()}". Use the following reference images from user if available.`;

            // const contents = [
            //     ...this.historyService.getHistory(botMessage.channelId)
            //         .messages,
            //     {
            //         role: "user",
            //         parts: [
            //             { text: prompt },
            //             ...botMessage.getAIAttachments(),
            //             ...referenceAIImages,
            //             ...botMessage.getAILinks(),
            //         ],
            //     },
            // ];

            // const result = await this.imageService.generateContent({
            //     contents: contents,
            // });

            // if (
            //     result.response.candidates.length === 0 ||
            //     !result.response.candidates[0].content ||
            //     !result.response.candidates[0].content.parts
            // ) {
            //     return {
            //         text: `Rewrite this as your response: ${result.response.text()}`,
            //     };
            // }

            // const resultImage =
            //     result.response.candidates[0].content.parts.find(
            //         (part) => part.inlineData
            //     );

            // if (resultImage === undefined) {
            //     return {
            //         text: `Rewrite this as your response: ${result.response.text()}`,
            //     };
            // }

            // const buffer = Buffer.from(resultImage.inlineData.data, "base64");
            // return {
            //     text: `Rewrite this as your response: ${result.response.text()}`,
            //     image: buffer,
            // };
        } catch (error) {
            console.error("Error generating image:", error);
            return null;
        }
    }

    async extractSearchQuery(botMessage) {
        for (let i = 0; i < 3; i++) {
            const prompt = `Generate a search query based on the conversation history and the following message: "${botMessage.getCleanContent()}". Return only the search query as a short phrase, wrapped in quotation marks. Remember that your response is a search query for a search engine, please do not include anything else except the term. For example, return just only "Fish with red and blue stripe"`;

            try {
                const contents = [
                    ...this.historyService.getHistory(botMessage.channelId)
                        .messages,
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

                const response = result.response.text();
                const matches = response.match(/"([^"]*)"/g);
                const query = matches ? matches.at(-1).slice(1, -1) : null;
                if (query === null) {
                    continue;
                }

                return query;
            } catch (error) {
                console.error("Error extracting topic:", error);
            }
        }

        return null;
    }
}
