import config from "../config.js";
import { HelperUtils } from "../utils/HelperUtils.js";

export class BalanceService {
    constructor(stores) {
        this.userStore = stores.userStore;
    }

    async getUserBalance(userId) {
        return this.userStore.getBalance(userId);
    }

    async addUserBalance(userId, amount) {
        return this.userStore.addBalance(userId, amount);
    }

    async giveUserBalance(fromUserId, toUserId, amount) {
        return this.userStore.giveBalance(fromUserId, toUserId, amount);
    }

    async getRichestUsers(limit) {
        return this.userStore.getRichestUsers(limit);
    }

    async claimDailyBalance(userId) {
        const amount = HelperUtils.getRandomInt(
            config.currency.daily.minAmount,
            config.currency.daily.maxAmount
        );
        const balance = await this.userStore.claimDailyBalance(userId, amount);
        return {
            amount,
            balance,
        };
    }
}
