import client from "../client.js";
import { SYMBOLS } from "../consts/baucua.js";
import * as BaucuaPresenter from "../presenters/BaucuaPresenter.js";

export class BaucuaService {
    constructor(stores) {
        this.store = stores.baucuaStore;
        this.timers = new Map();
    }

    async init() {
        const games = await this.store.findActiveGames();
        const now = Date.now();
        for (const game of games) {
            if (new Date(game.ends_at).getTime() <= now) {
                await this._refundAndUpdateMessage(game);
            } else {
                await this._refreshGameMessage(game);
                this._scheduleGameEnd(game);
            }
        }
    }

    async startGame(channelId, startedBy, durationSeconds) {
        const gameId = await this.store.createGame(channelId, startedBy, durationSeconds);
        return this.store.findGame(gameId);
    }

    async attachGameMessage(gameId, messageId) {
        await this.store.setGameMessage(gameId, messageId);
        const game = await this.store.findGame(gameId);
        this._scheduleGameEnd(game);
        return game;
    }

    async placeBet(channelId, userId, symbol, amount) {
        const game = await this.store.findActiveGameByChannel(channelId);
        if (!game) throw new Error("BAUCUA_NO_ACTIVE_GAME");

        await this.store.withTransaction(async (conn) => {
            const locked = await this.store.lockGame(game.id, conn);
            if (!locked || locked.status !== "active") throw new Error("BAUCUA_BETTING_CLOSED");
            if (Date.now() >= new Date(locked.ends_at).getTime()) throw new Error("BAUCUA_BETTING_CLOSED");

            await this.store.ensurePlayer(userId, conn);
            const player = await this.store.lockPlayerBalance(userId, conn);
            if (Number(player.balance) < amount) throw new Error("INSUFFICIENT_BALANCE");

            await this.store.debitPlayer(userId, amount, conn);
            await this.store.insertBet(game.id, userId, symbol, amount, conn);
        });

        await this._refreshGameMessage(game);
    }

    async finishGame(gameId) {
        const game = await this.store.findGame(gameId);
        if (!game || game.status !== "active") {
            this._clearTimer(gameId);
            return;
        }

        const dices = this.rollDice();

        const { bets, summary } = await this.store.withTransaction(async (conn) => {
            const locked = await this.store.lockGame(gameId, conn);
            if (!locked || locked.status !== "active") return { bets: [], summary: [] };

            const bets = await this.store.findBets(gameId, conn);
            const settlements = this._computeSettlements(bets, dices);

            await this.store.markSettled(gameId, dices, conn);

            const summary = [];
            for (const [userId, { credit, net }] of Object.entries(settlements)) {
                if (credit > 0) await this.store.creditPlayer(userId, credit, conn);
                summary.push({ user_id: userId, net_change: net });
            }

            return { bets, summary };
        });

        this._clearTimer(gameId);

        if (game.message_id) {
            const embed = BaucuaPresenter.buildResultEmbed(game, bets, dices, summary);
            await this._editGameMessage(game, (_, msg) => msg.edit({ embeds: [embed] }));
        }
    }

    rollDice() {
        const keys = SYMBOLS.map((s) => s.key);
        return Array.from({ length: 3 }, () => keys[Math.floor(Math.random() * keys.length)]);
    }

    _computeSettlements(bets, dices) {
        const diceCounts = {};
        for (const die of dices) diceCounts[die] = (diceCounts[die] || 0) + 1;

        const settlements = {};
        for (const bet of bets) {
            const matchCount = diceCounts[bet.symbol] || 0;
            if (!settlements[bet.user_id]) settlements[bet.user_id] = { credit: 0, net: 0 };

            if (matchCount > 0) {
                settlements[bet.user_id].credit += Number(bet.amount) * (1 + matchCount);
                settlements[bet.user_id].net   += Number(bet.amount) * matchCount;
            } else {
                settlements[bet.user_id].net   -= Number(bet.amount);
            }
        }
        return settlements;
    }

    async getStats() {
        const { gamesRow, betsRow, diceRows } = await this.store.queryStats();

        const faceCounts = { stag: 0, calabash: 0, cock: 0, fish: 0, crab: 0, prawn: 0 };
        for (const row of diceRows) {
            const faces = typeof row.dices === "string" ? JSON.parse(row.dices) : row.dices;
            for (const face of faces) {
                if (face in faceCounts) faceCounts[face]++;
            }
        }

        return { games: Number(gamesRow.games), bets: Number(betsRow.bets), ...faceCounts };
    }

    _scheduleGameEnd(game) {
        this._clearTimer(game.id);
        const delay = Math.max(0, new Date(game.ends_at).getTime() - Date.now() + 500);
        const timer = setTimeout(async () => {
            try { await this.finishGame(game.id); }
            catch (e) { console.error("Failed to finish baucua game", e); }
        }, delay);
        this.timers.set(game.id, timer);
    }

    _clearTimer(gameId) {
        if (this.timers.has(gameId)) {
            clearTimeout(this.timers.get(gameId));
            this.timers.delete(gameId);
        }
    }

    async _refreshGameMessage(game) {
        if (!game.message_id) return;
        const bets = await this.store.findBets(game.id);
        const embed = BaucuaPresenter.buildGameEmbed(game, bets);
        await this._editGameMessage(game, (_, msg) => msg.edit({ embeds: [embed] }));
    }

    async _refundAndUpdateMessage(game) {
        try {
            await this.store.withTransaction(async (conn) => {
                const locked = await this.store.lockGame(game.id, conn);
                if (!locked || locked.status !== "active") return;

                await this.store.markRefunded(game.id, conn);

                const refunds = await this.store.findBetTotalsByUser(game.id, conn);
                for (const row of refunds) {
                    await this.store.creditPlayer(row.user_id, Number(row.total), conn);
                }
            });
        } catch (e) {
            console.warn("Refund failed for game", game.id, e);
        }

        if (!game.message_id) return;
        const bets = await this.store.findBets(game.id);
        const embed = BaucuaPresenter.buildRefundedEmbed(game, bets);
        await this._editGameMessage(game, (_, msg) => msg.edit({ embeds: [embed] }));
    }

    async _editGameMessage(game, fn) {
        try {
            const channel = await client.channels.fetch(game.channel_id);
            if (!channel?.isTextBased()) return;
            const message = await channel.messages.fetch(game.message_id);
            await fn(channel, message);
        } catch (e) {
            console.warn("Failed to edit game message", e);
        }
    }
}
