import { ChannelType, Message, ThreadAutoArchiveDuration } from "discord.js";
import client from "../index.js";
import { MessageUtils } from "../utils/MessageUtils.js";
import dotenv from "dotenv";
import TurndownService from "turndown";

dotenv.config();
const LEETCODE_CHANNEL_ID = process.env.LEETCODE_CHANNEL_ID;

export class LeetcodeHandler {
    constructor(services) {
        this.leetcodeService = services.leetcodeService;
    }

    async start() {
        let data = null;

        const now = new Date();
        while (!data) {
            data = await this.leetcodeService.getDailyQuestion();

            if (
                !data ||
                !data.date ||
                !data.question ||
                !this.isToday(new Date(data.date))
            ) {
                data = null;
                await new Promise((resolve) => setTimeout(resolve, 60000));
            }
        }

        const channel = await client.channels.fetch(LEETCODE_CHANNEL_ID);
        const threadName = `${data.question.questionFrontendId}. ${data.question.title}`;

        this.thread = channel.threads.cache.find((thread) => {
            return (
                thread.name === threadName &&
                this.isToday(thread.createdAt) &&
                thread.ownerId === client.user.id
            );
        });

        if (!this.thread) {
            const availableTags = channel.availableTags;
            const tagToId = availableTags.reduce((acc, tag) => {
                acc[tag.name] = tag.id;
                return acc;
            }, {});

            this.thread = await channel.threads.create({
                name: threadName,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                invitable: false,
                message: {
                    content:
                        this.leetcodeService
                            .getRegistrants()
                            .map((entry) => `<@${entry.userId}>`)
                            .join(" ") +
                        " Time for today's LeetCode Daily Challenge!",
                },
                type: ChannelType.PrivateThread,
                appliedTags: [tagToId[data.question.difficulty]],
            });

            let content = this.formatContent(data.question.content);
            content =
                `# ${threadName}\n\n## Difficulty: ${data.question.difficulty}\n\n## Statement\n\n` +
                content +
                `\n\n## [Link to the question](https://leetcode.com${data.link})`;

            const messages = MessageUtils.splitMessage(content);
            for (const message of messages) {
                await this.thread.send({
                    content: message,
                    allowedMentions: { users: [] },
                });
            }
        }

        const stopTime = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
                0,
                0,
                0,
                0
            )
        );

        const lastUpdate = new Date();
        const acceptedUsers = new Set();
        const intervalId = setInterval(async () => {
            const now = Date.now();

            if (now >= stopTime) {
                clearInterval(intervalId);
                const acceptedUserIds = Array.from(acceptedUsers);
                let congratulationMessage = "";
                if (acceptedUserIds.length === 0) {
                    congratulationMessage =
                        "No one solved the challenge today.";
                } else if (acceptedUserIds.length === 1) {
                    congratulationMessage = `Congratulations to <@${acceptedUserIds[0]}> for being the only one to solve the challenge today!`;
                } else {
                    const mentions = acceptedUserIds.map((id) => `<@${id}>`);
                    congratulationMessage = `Congratulations to ${mentions
                        .slice(0, -1)
                        .join(", ")} and ${mentions.at(
                        -1
                    )} for solving the challenge today!`;
                }

                await this.thread.send({
                    content: `The LeetCode Daily Challenge has ended. ${congratulationMessage}`,
                    allowedMentions: { users: [] },
                });
                return;
            }

            try {
                const newUpdate = new Date();
                const newSubmissions = [];
                for (const user of this.leetcodeService.getRegistrants()) {
                    const submissions =
                        await this.leetcodeService.getSubmissionsByQuestionBetween(
                            user.username,
                            data.question.titleSlug,
                            lastUpdate,
                            newUpdate
                        );

                    for (const submission of submissions) {
                        newSubmissions.push({
                            user,
                            submission,
                        });
                    }
                }

                newSubmissions.sort((a, b) => {
                    return (
                        new Date(a.submission.timestamp * 1000) -
                        new Date(b.submission.timestamp * 1000)
                    );
                });

                for (const submissionData of newSubmissions) {
                    const user = submissionData.user;
                    const submission = submissionData.submission;
                    const status = submission.statusDisplay;

                    if (status === "Accepted") {
                        acceptedUsers.add(user.userId);
                    }

                    const solution =
                        status === "Accepted"
                            ? `[solution](https://leetcode.com${submission.url})`
                            : "solution";
                    await this.thread.send({
                        content: `<@${user.userId}> submitted a ${solution} <t:${submission.timestamp}:R> and got **${status}**.`,
                        allowedMentions: { users: [] },
                    });
                }

                lastUpdate.setTime(newUpdate.getTime());
            } catch (error) {
                console.error("Error fetching submissions:", error);
            }
        }, 60 * 1000);
    }

    formatContent(content) {
        let result = content
            .replace(/\\\\u/g, "\\u")
            .replace(/\\u[\dA-Fa-f]{4}/g, (m) =>
                String.fromCharCode(parseInt(m.slice(2), 16))
            )
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/<sup>(\d+)<\/sup>/g, "^$1");

        const turndownService = new TurndownService();
        result = turndownService.turndown(result);

        result = result
            .replace(/\*\*Example (\d+):\*\*/g, "### Example $1")
            .replace(/^(### Example 1)/m, "## Example\n\n$1")
            .replace(/\*\*Constraints:\*\*/g, "## Constraints")
            .replace(/\*\*Follow-up:\*\* /g, "## Follow-up\n\n")
            .replace(
                /^\*\*Input:\*\*\s*(.+)$/gm,
                (_, content) =>
                    `**Input:** \`${content.replace(/\\([\[\]])/g, "$1")}\``
            )
            .replace(
                /^\*\*Output:\*\*\s*(.+)$/gm,
                (_, content) =>
                    `**Output:** \`${content.replace(/\\([\[\]])/g, "$1")}\``
            )
            .replace(
                /^\*\*Explanation:\*\*\s*(.+)$/gm,
                (_, content) =>
                    `**Explanation:** ${content.replace(/\\([\[\]])/g, "$1")}`
            );

        return result;
    }

    isToday(date) {
        const now = new Date();
        return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
        );
    }
}
