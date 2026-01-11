import { sprintf } from "sprintf-js";
import client from "../client.js";
import { error } from "../consts/error.js";
import { LRUCache } from "lru-cache";

export class TokenUtils {
    static userCache = new LRUCache({
        max: 1000,
        ttl: 5 * 60 * 1000,
        updateAgeOnGet: true,
        updateAgeOnHas: true,
    });

    static getString(token, choices = null) {
        if (choices && !choices.includes(token)) {
            throw new Error(
                sprintf(error.INVALID_CHOICE, token, choices.join(", "))
            );
        }

        return token;
    }

    static getInteger(token, minValue = null, maxValue = null) {
        const result = parseInt(token, 10);
        if (isNaN(result)) {
            throw new Error(sprintf(error.INVALID_INTEGER, token));
        }

        if (minValue !== null && result < minValue) {
            throw new Error(
                sprintf(error.INVALID_GEQ_INTEGER, token, minValue)
            );
        }

        if (maxValue !== null && result > maxValue) {
            throw new Error(
                sprintf(error.INVALID_LEQ_INTEGER, token, maxValue)
            );
        }

        return result;
    }

    static async getUser(token) {
        const pattern = /^<@!?(\d+)>$/;
        const match = token.match(pattern);
        if (!match) {
            throw new Error(sprintf(error.INVALID_USER, token));
        }
        const userId = match[1];

        const cachedUser = TokenUtils.userCache.get(userId);
        if (cachedUser !== undefined) {
            return cachedUser;
        }

        try {
            const user = await client.users.fetch(userId);
            TokenUtils.userCache.set(userId, user);
            return user;
        } catch (err) {
            throw new Error(sprintf(error.USER_NOT_FOUND, token));
        }
    }
}
