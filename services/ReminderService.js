import cron from "node-cron";
import client from "../index.js";

export class ReminderService {
    constructor() {
        this.reminders = new Map();
        this.reminderCounter = 0;
    }

    setReminder(channelId, userId, reminderDetails) {
        try {
            const reminderId = ++this.reminderCounter;
            const cronExpression = this.parseToCron(reminderDetails.when);

            if (!cronExpression) {
                return false;
            }

            const task = cron.schedule(
                cronExpression,
                () => {
                    this.sendReminder(channelId, userId, reminderDetails);
                },
                {
                    timezone: "Etc/UTC",
                    scheduled: false,
                }
            );

            this.reminders.set(reminderId, {
                task,
                channelId,
                userId,
                details: reminderDetails,
            });

            task.start();
            return reminderId;
        } catch (error) {
            console.error("Error setting reminder:", error);
            return -1;
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
        try {
            const channel = client.channels.cache.get(channelId);
            channel.send(`<@${userId}> ${reminderDetails.reminderText}`);
        } catch (error) {
            console.error("Error sending reminder:", error);
        }
    }

    cancelReminder(userId, reminderId) {
        const reminder = this.reminders.get(reminderId);
        if (!reminder) {
            console.log("Reminder does not exist");
            return -1;
        }

        if (reminder.userId != userId) {
            console.log("Reminder does not belong to user");
            return 1;
        }

        reminder.task.stop();
        this.reminders.delete(reminderId);
        return 0;
    }
}
