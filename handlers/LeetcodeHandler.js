import { ChannelType, ThreadAutoArchiveDuration } from "discord.js";
import client from "../index.js";
import { MessageUtils } from "../utils/MessageUtils.js";
import dotenv from "dotenv";

dotenv.config();
const LEETCODE_CHANNEL_ID = process.env.LEETCODE_CHANNEL_ID;

export class LeetcodeHandler {
    constructor(services) {
        this.chatService = services.chatService;
        this.historyService = services.historyService;
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

        const prompt = `Tell the me about today's Leetcode Daily Challenge:\n\n**ID:** ${data.question.questionFrontendId}\n**Title:** ${data.question.title}\n**Difficulty:** ${data.question.difficulty}\n**Statement (in html format):** ${data.question.content}\n\nLink: https://leetcode.com${data.link}\n\nPlease format your response in Discord Markdown format, include EVERY information provided but do not provide any solution or comment to the question. Remember to add the question ID follows by a dot and a space before the title (like "1. Two Sum"). Do not forget to add the source link at the end of the question. Finally, the response should be human-readable and do not contain any html element.\n\nFollow this example carefully:\n# 1. Two Sum\n## Difficulty: Easy\n## Statement\nGiven an array of integers, return indices of the two numbers such that they add up to a specific target. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n## Example\n### Example 1\n**Input:** \`nums = [2,7,11,15], target = 9\`\n**Output:** \`[0,1]\`\n**Explanation:** \`Because nums[0] + nums[1] == 9, we return [0, 1]\`.\n### Example 2\n**Input:** \`nums = [3,2,4], target = 6\`\n**Output:** \`[1,2]\`\n### Example 3\n**Input:** \`nums = [3,3], target = 6\`\n**Output:** \`[0,1]\`\n##Constraints\n- \`2 <= nums.length <= 10^4\`\n- \`-10^9 <= nums[i] <= 10^9\`\n- \`-10^9 <= target <= 10^9\`\n- Only one valid answer exists.\n## [Source](https://leetcode.com/problems/two-sum)`;

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

        this.historyService.initHistory(this.thread.id);
        const chat = this.chatService.startChat({
            history: this.historyService.getHistory(this.thread.id).messages,
            tools: [{ google_search: {} }],
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response.text();

        const messages = MessageUtils.splitMessage(`${response}`);
        for (const message of messages) {
            await this.thread.send({
                content: message,
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

                await this.thread.send({
                    content: `<@${user.userId}> submitted <t:${submission.timestamp}:R> and got **[${submission.statusDisplay}](https://leetcode.com${submission.url})**.`,
                    allowedMentions: { users: [] },
                });
            }

            lastUpdate.setTime(newUpdate.getTime());
        }, 60 * 1000);
    }
}
