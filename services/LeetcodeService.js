import {
    LeetcodeRegistrants,
    LeetcodeStandings,
} from "../utils/StorageUtils.js";
import { HelperUtils } from "../utils/HelperUtils.js";

const LEETCODE_API_URL = "https://leetcode-api-pied.vercel.app/";

export class LeetcodeService {
    constructor() {
        LeetcodeRegistrants.read().then((data) => {
            this.registrants = HelperUtils.deepObjectToMap(data);
        });

        LeetcodeStandings.read().then((data) => {
            this.standings = HelperUtils.deepObjectToMap(data);
        });
    }

    async getQuestionInfo(questionSlug) {
        return await this.#fetchData(`problem/${questionSlug}`);
    }

    async getDailyQuestion() {
        return await this.#fetchData("daily");
    }

    async getRandomQuestion() {
        while (true) {
            const data = await this.#fetchData("random");
            if (!data || !data.title_slug) {
                continue;
            }

            const info = await this.getQuestionInfo(data.title_slug);
            if (info && info.content && info.isPaidOnly === false) {
                return data;
            }
        }
    }

    async getUserProfile(username) {
        return await this.#fetchData(`user/${username}`);
    }

    async checkIfUserExists(username) {
        const data = await this.#fetchData(`user/${username}`);
        return data && data.username === username;
    }

    async getRecentSubmissions(username) {
        return await this.#fetchData(`user/${username}/submissions`);
    }

    async getRecentSubmissionsByQuestion(username, questionSlug) {
        const submissions = await this.getRecentSubmissions(username);
        return submissions.filter(
            (submission) => submission.titleSlug === questionSlug
        );
    }

    async getSubmissionsByQuestionFrom(username, questionSlug, startTime) {
        const submissions = await this.getRecentSubmissionsByQuestion(
            username,
            questionSlug
        );
        return submissions.filter(
            (submission) => new Date(submission.timestamp * 1000) >= startTime
        );
    }

    async getSubmissionsByQuestionTo(username, questionSlug, endTime) {
        const submissions = await this.getRecentSubmissionsByQuestion(
            username,
            questionSlug
        );
        return submissions.filter(
            (submission) => new Date(submission.timestamp * 1000) <= endTime
        );
    }

    async getSubmissionsByQuestionBetween(
        username,
        questionSlug,
        startTime,
        endTime
    ) {
        const submissions = await this.getRecentSubmissionsByQuestion(
            username,
            questionSlug
        );
        return submissions.filter(
            (submission) =>
                new Date(submission.timestamp * 1000) >= startTime &&
                new Date(submission.timestamp * 1000) <= endTime
        );
    }

    async #fetchData(endpoint) {
        try {
            const response = await fetch(`${LEETCODE_API_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching data from LeetCode API:", error);
            return null;
        }
    }

    checkIfRegistered(userId) {
        return this.registrants.has(userId);
    }

    registerUser(userId, username) {
        this.registrants.set(userId, username);
        LeetcodeRegistrants.write(
            HelperUtils.deepMapToObject(this.registrants)
        );
    }

    unregisterUser(userId) {
        this.registrants.delete(userId);
        LeetcodeRegistrants.write(
            HelperUtils.deepMapToObject(this.registrants)
        );
    }

    getRegistrants() {
        return Array.from(this.registrants.entries()).map(
            ([userId, username]) => ({
                userId,
                username,
            })
        );
    }

    updateStandings(date, submission) {
        const day = date.toISOString().split("T")[0];
        if (!this.standings.has(day)) {
            this.standings.set(day, new Map());
        }

        const dailyStandings = this.standings.get(day);

        const userId = submission.author.userId;

        if (!dailyStandings.has(userId)) {
            dailyStandings.set(userId, {
                attempts: 0,
                accepted: 0,
                timestamp: null,
            });
        }

        const userStandings = dailyStandings.get(userId);
        if (userStandings.accepted === 0) {
            if (submission.statusDisplay !== "Compile Error") {
                userStandings.attempts += 1;
            }

            if (submission.statusDisplay === "Accepted") {
                userStandings.accepted = 1;
                userStandings.timestamp = submission.timestamp;
            }
        }

        this.standings.set(day, dailyStandings);
        LeetcodeStandings.write(HelperUtils.deepMapToObject(this.standings));
    }

    getStandings(date) {
        const day = date.toISOString().split("T")[0];
        if (!this.standings.has(day)) {
            return [];
        }

        const dailyStandings = this.standings.get(day);
        return Array.from(dailyStandings.entries()).map(([userId, data]) => ({
            userId,
            attempts: data.attempts,
            accepted: data.accepted,
            timestamp: data.timestamp,
        }));
    }
}
