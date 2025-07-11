export class RegisterHandler {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
        this.leetcodeService = services.leetcodeService;
    }

    async handle(botmessage, state = null) {
        if (!state) {
            return await this.processRegister(botmessage);
        } else if (state.type === "confirm") {
            return await this.confirmRegistration(botmessage, state);
        }
    }

    async processRegister(botmessage) {
        try {
            const leetcodeDetails = await this.extractLeetcodeDetails(
                botmessage
            );

            if (!leetcodeDetails) {
                throw new Error("Cannot extract LeetCode details");
            }

            if (leetcodeDetails.type === "register") {
                if (
                    this.leetcodeService.checkIfRegistered(botmessage.author.id)
                ) {
                    return {
                        text: "You tell me (the user) that I'm already registered for LeetCode Daily Challenge",
                    };
                }

                if (!leetcodeDetails.username) {
                    return {
                        text: "You ask me (the user) for my LeetCode username to register for LeetCode Daily Challenge",
                    };
                }

                const userExists = await this.leetcodeService.checkIfUserExists(
                    leetcodeDetails.username
                );
                if (!userExists) {
                    return {
                        text: `You tell me (the user) that the LeetCode user \`${leetcodeDetails.username}\` does not exist on LeetCode`,
                    };
                }

                const data = await this.leetcodeService.getRandomQuestion();
                const nextMinute = new Date();
                nextMinute.setMinutes(nextMinute.getMinutes() + 1);

                return {
                    text: `You tell me (the user) to validate their LeetCode username by submitting anything on the following question: [${
                        data.title
                    }](${
                        data.url
                    }). This confirmation will expire <t:${Math.floor(
                        nextMinute.getTime() / 1000
                    )}:R>. The infomation must be included in the response in given Discord format. Do not include the information in code block. Do not show the full link, just the title and the link inside in Markdown format.`,
                    state: {
                        type: "confirm",
                        username: leetcodeDetails.username,
                        questionSlug: data.title_slug,
                    },
                    delay: 60000,
                };
            } else {
                if (
                    !this.leetcodeService.checkIfRegistered(
                        botmessage.author.id
                    )
                ) {
                    return {
                        text: "You tell me (the user) that they are not registered for LeetCode Daily Challenge",
                    };
                }

                this.leetcodeService.unregisterUser(botmessage.author.id);
                return {
                    text: "You tell me (the user) that they have been unregistered successfully from LeetCode Daily Challenge",
                };
            }
        } catch (error) {
            console.error("Error processing registration:", error);
            return null;
        }
    }

    async confirmRegistration(botmessage, state) {
        try {
            const data =
                await this.leetcodeService.getSubmissionsByQuestionFrom(
                    state.username,
                    state.questionSlug,
                    new Date(Date.now() - 60 * 1000)
                );

            if (data.length > 0) {
                this.leetcodeService.registerUser(
                    botmessage.author.id,
                    state.username
                );
                return {
                    text: `You tell me (the user) that they have been registered successfully with username \`${state.username}\` for LeetCode Daily Challenge`,
                };
            } else {
                return {
                    text: "You tell me (the user) that you have not received any submissions on the question in the last minute, so you cannot confirm their registration",
                };
            }
        } catch (error) {
            console.error("Error confirming registration:", error);
            return null;
        }
    }

    async extractLeetcodeDetails(botmessage) {
        try {
            const prompt = `
Extract reminder details from the history and this message and return me (the user) in the following JSON format:
{
    "type": "register" or "unregister",
    "username" (if type is "register"): Their LeetCode username (if not specified, just return null),
}
    
message: "${botmessage.getCleanContent()}"

Do not include anything else except the JSON object. **The JSON must be valid**.`;

            const result = await this.chatService.generateContent({
                contents: [
                    await this.historyService.getHistory(
                        botmessage.channelId,
                        botmessage.id
                    ),
                    { role: "user", parts: [{ text: prompt }] },
                ],
            });

            let response = result.response.text();

            const lines = response.split("\n");
            const firstCodeLine = lines.findIndex((line) =>
                line.trim().startsWith("```")
            );
            const lastCodeLine =
                lines.length -
                1 -
                [...lines]
                    .reverse()
                    .findIndex((line) => line.trim().startsWith("```"));
            if (
                firstCodeLine !== -1 &&
                lastCodeLine !== -1 &&
                firstCodeLine < lastCodeLine
            ) {
                response = lines
                    .slice(firstCodeLine + 1, lastCodeLine)
                    .join("\n");
            }

            return JSON.parse(response);
        } catch (error) {
            console.error("Error extracting LeetCode details:", error);
            return null;
        }
    }
}
