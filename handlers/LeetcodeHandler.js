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
        const today = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );

        while (!data) {
            data = await this.leetcodeService.getDailyQuestion();

            if (
                !data ||
                !data.date ||
                !data.question ||
                Date.parse(data.date) !== today.getTime()
            ) {
                data = null;
                await new Promise((resolve) => setTimeout(resolve, 60000));
            }
        }

        const channel = await client.channels.fetch(LEETCODE_CHANNEL_ID);
        const threadName = `${data.question.questionFrontendId}. ${data.question.title}`;
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
            `# ${data.question.title}\n\n## Difficulty: ${data.question.difficulty}\n\n## Statement\n\n` +
            content +
            `\n\n## [Link to the question](https://leetcode.com${data.link})`;

        const messages = MessageUtils.splitMessage(content);
        for (const message of messages) {
            await this.thread.send({
                content: message,
                allowedMentions: { users: [] },
            });
        }

        const stopTime = new Date(
            new Date(
                Date.UTC(
                    now.getUTCFullYear(),
                    now.getUTCMonth(),
                    now.getUTCDate(),
                    now.getUTCHours()
                )
            )
        );
        stopTime.setUTCDate(stopTime.getUTCDate() + 1);

        const lastUpdate = new Date();
        const intervalId = setInterval(async () => {
            const now = Date.now();

            if (now >= stopTime) {
                clearInterval(intervalId);
                this.thread.send({
                    content:
                        "The LeetCode Daily Challenge has ended for today. See you tomorrow!",
                });
                return;
            }

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

                const solution =
                    submission.statusDisplay === "Accepted"
                        ? `[solution](https://leetcode.com${submission.url})`
                        : "solution";
                await this.thread.send({
                    content: `<@${user.userId}> submitted a ${solution} <t:${submission.timestamp}:R> and got **${submission.statusDisplay}**`,
                    allowedMentions: { users: [] },
                });
            }

            lastUpdate.setTime(newUpdate.getTime());
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
}
