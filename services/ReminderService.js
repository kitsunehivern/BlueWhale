import cron from "node-cron";
import client from "../index.js";

export class ReminderService {
    constructor() {}

    setReminder(channelId, userId, reminderDetails) {
        try {
            const cronExpression = this.parseToCron(reminderDetails.when);

            if (!cronExpression) {
                return false;
            }

            cron.schedule(
                cronExpression,
                () => {
                    this.sendReminder(channelId, userId, reminderDetails);
                },
                {
                    timezone: "Etc/UTC",
                }
            );

            return true;
        } catch (error) {
            console.error("Error setting reminder:", error);
            return false;
        }
    }

    parseToCron(date) {
        const second = date.getUTCSeconds();
        const minute = date.getUTCMinutes();
        const hour = date.getUTCHours();
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const weekday = "*";

        return `${second} ${minute} ${hour} ${day} ${month} ${weekday}`;
    }

    async sendReminder(channelId, userId, reminderDetails) {
        const channel = client.channels.cache.get(channelId);
        channel.send(`<@${userId}> ${reminderDetails.reminder}`);
    }
}
