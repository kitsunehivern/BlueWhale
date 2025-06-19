export class ReminderHandler {
    constructor(services) {
        this.chatService = services.chatService;
        this.reminderService = services.reminderService;
        this.historyService = services.historyService;
    }

    async handle(botMessage) {
        try {
            const reminderDetails = await this.extractReminderDetails(
                botMessage
            );

            if (!reminderDetails) {
                throw Error("Cannot extract reminder details");
            }

            if (reminderDetails.type === "add") {
                if (reminderDetails.when === null) {
                    return {
                        text: "Ask for the specific time of the reminder",
                    };
                }

                reminderDetails.when = new Date(reminderDetails.when);

                const now = new Date(botMessage.timestamp);
                const reminderTime = reminderDetails.when;
                const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

                if (reminderTime.getTime() < now.getTime()) {
                    return {
                        text: "Tell that the reminder time is in the past and ask for a valid future time",
                    };
                }

                if (reminderTime.getTime() - now.getTime() > oneWeekMs) {
                    return {
                        text: "Tell that the reminder time is too far in the future (over one week) and ask for a closer time",
                    };
                }

                const reminderId = await this.reminderService.setReminder(
                    botMessage.channelId,
                    botMessage.author.id,
                    reminderDetails
                );

                if (reminderId !== -1) {
                    const reminderTimestamp = Math.floor(
                        reminderDetails.when.getTime() / 1000
                    );
                    return {
                        text: `Tell that the reminder about ${reminderDetails.content} is set with ID \`${reminderId}\` at <t:${reminderTimestamp}:F> (this is the absoulute time), which is <t:${reminderTimestamp}:R> (this is the relative time). All the information about the time must be included in the response in given Discord format and do not include the text in the parenthesis. The user can cancel the reminder using the reminder ID`,
                    };
                } else {
                    return null;
                }
            } else if (reminderDetails.type === "cancel") {
                if (reminderDetails.reminderId === null) {
                    return { text: "Ask for the specific ID of the reminder" };
                }

                const code = await this.reminderService.cancelReminder(
                    botMessage.author.id,
                    reminderDetails.reminderId
                );

                if (code == -1) {
                    return { text: "Tell that the reminder does not exist" };
                } else if (code == 1) {
                    return {
                        text: "Tell that the reminder is not set by the user and cannot be canceled",
                    };
                } else {
                    return {
                        text: `Tell that the reminder with ID \`${reminderDetails.reminderId}\` has been canceled`,
                    };
                }
            } else {
                return {
                    text: `Tell that the action on the reminder is unknown`,
                };
            }
        } catch (error) {
            console.error("Error in ReminderHandler:", error);
            return null;
        }
    }

    async extractReminderDetails(botMessage) {
        try {
            const prompt = `
Extract reminder details from the history and this message and return them in the following JSON format:
{
    "type": "add" or "cancel",
    "content" (if type is "add"): what to remind about (if not specified, just return "reminder"),
    "when": when to remind (absolute time with ISO format like "2025-06-06T00:00:00.000Z" in UTC+0), the current time is ${new Date(
        botMessage.timestamp
    ).toISOString()} in UTC+0. If user input a specific time without their local time, assume it's in **UTC+7**. If the user did not specify the time, simply return null,
    "reminderText" (if type is "add"): The text to display at the reminder time. Include your persona in the message, as this will be shown to the user when the reminder activates. For example, "Uhe~ Time to sleep, just like Oji-san! Don't forget to rest, Sensei~",
    "reminderId" (if type is "cancel"): An positive integer that defines the reminder. If the user did not specify the id, simply return null
}

Message: "${botMessage.getCleanContent()}"

Do not include anything else except the JSON object. **The JSON must be valid**.
            `;

            const result = await this.chatService.generateContent({
                contents: [
                    this.historyService.getHistory(botMessage.channelId)
                        .messages,
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
            console.error("Error extracting reminder details:", error);
            return null;
        }
    }
}
