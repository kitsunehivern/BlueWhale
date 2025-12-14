export class BalanceService {
    constructor(stores) {
        this.userBalanceStore = stores.userBalanceStore;
    }

    async getUserBalance(userId) {
        return this.userBalanceStore.getBalance(userId);
    }

    async adjustUserBalance(userId, delta) {
        return this.userBalanceStore.adjustBalance(userId, delta);
    }

    async transferUserBalance(fromUserId, toUserId, amount) {
        return this.userBalanceStore.transferBalance(
            fromUserId,
            toUserId,
            amount
        );
    }

    async stealUserBalance(thiefUserId, victimUserId) {
        return this.userBalanceStore.stealBalance(thiefUserId, victimUserId);
    }

    async getRichestUsers(limit) {
        return this.userBalanceStore.getRichestUsers(limit);
    }
}
