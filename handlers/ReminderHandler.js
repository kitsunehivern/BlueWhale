export class ReminderHandler {
    constructor(services) {
        this.aiService = services.aiService;
        this.reminderService = services.reminderService;
        this.historyService = services.historyService;
    }

    async handle(botMessage) {
        try {
            const reminderDetails = await this.extractReminderDetails(
                botMessage
            );

            if (!reminderDetails) {
                return "Ask for the specific time of the reminder";
            }

            const now = new Date(botMessage.timestamp);
            const reminderTime = reminderDetails.when;
            const oneDayMs = 24 * 60 * 60 * 1000;

            if (reminderTime.getTime() < now.getTime()) {
                return "Tell that the reminder time is in the past and ask for a valid future time";
            }

            if (reminderTime.getTime() - now.getTime() > oneDayMs) {
                return "Tell that the reminder time is too far in the future (over one day) and ask for a closer time";
            }

            const success = await this.reminderService.setReminder(
                botMessage.channelId,
                botMessage.author.id,
                reminderDetails
            );

            if (success) {
                const reminderTimestamp = Math.floor(
                    reminderDetails.when.getTime() / 1000
                );
                return `Tell that the reminder about ${reminderDetails.content} is set at <t:${reminderTimestamp}:F> (absoulute time), which is <t:${reminderTimestamp}:R> (relative time). All the information about the time must be included in the response in given Discord format.`;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error in ReminderHandler:", error);
            return null;
        }
    }

    async extractReminderDetails(botMessage) {
        try {
            const prompt = `
Extract reminder details from the history and this message in the following JSON format:
{
    "content": what to remind about (if not specified, just return "reminder"),
    "when": when to remind (absolute time with ISO format like "2025-06-06T00:00:00.000Z" in UTC+0), the current time is ${new Date(
        botMessage.timestamp
    ).toISOString()} in UTC+0. If user input a specific time without their local time, assume it's in **UTC+7**. If the user did not specify the time, simply return null,
    "reminder": The reminder text to send at the reminder time, including your persona in the message.
}

Message: "${botMessage.getCleanContent()}"

If you can't extract clear reminder details, return null.
            `;

            let result = await this.aiService.generateContent({
                contents: [
                    this.historyService.getHistory(botMessage.channelId)
                        .messages,
                    { role: "user", parts: [{ text: prompt }] },
                ],
            });

            let response = result.response.text().trim();

            if (response.startsWith("```") && response.endsWith("```")) {
                const lines = response.split("\n");
                lines.shift();
                lines.pop();
                response = lines.join("\n");
            }

            result = JSON.parse(response);
            if (result.when === null) {
                return null;
            }

            result.when = new Date(result.when);
            return result;
        } catch (error) {
            console.error("Error extracting reminder details:", error);
            return null;
        }
    }
}
