import config from "../config.js";
import client from "../client.js";
import { EmbedBuilder } from "discord.js";

const SYMBOLS = [
    { key: "stag", label: "Nai" },
    { key: "calabash", label: "Bầu" },
    { key: "cock", label: "Gà" },
    { key: "fish", label: "Cá" },
    { key: "crab", label: "Cua" },
    { key: "prawn", label: "Tôm" },
];

export class BaucuaService {
    constructor(stores) {
        this.baucuaStore = stores.baucuaStore;
        this.timers = new Map();
    }

    async init() {
        const games = await this.baucuaStore.listActiveGames();
        const now = Date.now();
        for (const game of games) {
            const endsAt = new Date(game.ends_at).getTime();
            if (endsAt <= now) {
                await this._refundAndUpdateMessage(game);
            } else {
                await this._refreshGameMessage(game);
                this._scheduleGameEnd(game);
            }
        }
    }

    getSymbols() {
        return SYMBOLS;
    }

    async startGame(channelId, startedBy, durationSeconds) {
        const gameId = await this.baucuaStore.startGame(
            channelId,
            startedBy,
            durationSeconds
        );
        return this.baucuaStore.getGame(gameId);
    }

    async attachGameMessage(gameId, messageId) {
        await this.baucuaStore.setGameMessage(gameId, messageId);
        const game = await this.baucuaStore.getGame(gameId);
        this._scheduleGameEnd(game);
        return game;
    }

    async placeBet(channelId, userId, symbol, amount) {
        const game = await this.baucuaStore.getActiveGameByChannel(channelId);
        if (!game) {
            throw Error("BAUCUA_NO_ACTIVE_GAME");
        }

        await this.baucuaStore.placeBet(game.id, userId, symbol, amount);
        return this._refreshGameMessage(game);
    }

    async _refreshGameMessage(game) {
        if (!client || !game.message_id) {
            return;
        }

        const bets = await this.baucuaStore.listBets(game.id);
        const embed = this.buildGameEmbed(game, bets);

        const channel = await client.channels.fetch(game.channel_id);
        if (!channel || !channel.isTextBased()) {
            return;
        }

        const message = await channel.messages.fetch(game.message_id);
        await message.edit({ embeds: [embed] });
    }

    _scheduleGameEnd(game) {
        const endsAt = new Date(game.ends_at).getTime();
        const delay = Math.max(0, endsAt - Date.now() + 500);

        if (this.timers.has(game.id)) {
            clearTimeout(this.timers.get(game.id));
        }

        const timer = setTimeout(async () => {
            try {
                await this.finishGame(game.id);
            } catch (e) {
                console.log("Failed to finish baucua game", e);
            }
        }, delay);

        this.timers.set(game.id, timer);
    }

    async finishGame(gameId) {
        const game = await this.baucuaStore.getGame(gameId);
        if (!game || game.status !== "active") {
            return;
        }

        const dices = this.rollDice();
        const summary = await this.baucuaStore.settleGame(gameId, dices);
        const bets = await this.baucuaStore.listBets(gameId);

        if (client && game.message_id) {
            const embed = this.buildResultEmbed(game, bets, dices, summary);

            const channel = await client.channels.fetch(game.channel_id);
            if (channel && channel.isTextBased()) {
                const message = await channel.messages.fetch(game.message_id);
                await message.edit({ embeds: [embed] });
            }
        }

        if (this.timers.has(gameId)) {
            clearTimeout(this.timers.get(gameId));
            this.timers.delete(gameId);
        }
    }

    async _refundAndUpdateMessage(game) {
        try {
            await this.baucuaStore.refundGame(game.id);
        } catch (e) {
            console.warn("Refund baucua game failed", e);
        }

        if (!client || !game.message_id) {
            return;
        }

        const bets = await this.baucuaStore.listBets(game.id);
        const embed = this.buildRefundedEmbed(game, bets);

        const channel = await client.channels.fetch(game.channel_id);
        if (!channel || !channel.isTextBased()) {
            return;
        }

        const message = await channel.messages.fetch(game.message_id);
        await message.edit({ embeds: [embed] });
    }

    rollDice() {
        const keys = SYMBOLS.map((a) => a.key);
        const dices = [];
        for (let i = 0; i < 3; i++) {
            dices.push(keys[Math.floor(Math.random() * keys.length)]);
        }
        return dices;
    }

    buildGameEmbed(game, bets) {
        const endsAt = Math.floor(new Date(game.ends_at).getTime() / 1000);
        const betMap = this._groupBets(bets);

        const embed = new EmbedBuilder()
            .setColor(0x0000ff)
            .setTitle("Bầu cua")
            .setDescription(
                `Place bets with \`/place <symbol> <amount>\`. Round ends <t:${endsAt}:R>\n${this._buildSeperator()}`
            )
            .setFooter({ text: `Channel: ${game.channel_id}` });

        for (const symbol of SYMBOLS) {
            embed.addFields(this._renderSymbolField(symbol, betMap));
        }

        return embed;
    }

    buildResultEmbed(game, bets, dice, summaryRows) {
        const betMap = this._groupBets(bets);
        const diceLabels = dice
            .map((k) => SYMBOLS.find((a) => a.key === k)?.label || k)
            .join(", ");

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Bầu cua - Result")
            .setDescription(
                `
**Dice**: ${diceLabels}
**Payouts**:
${this._renderSummary(summaryRows)}
${this._buildSeperator()}
                `.trim()
            );

        for (const symbol of SYMBOLS) {
            embed.addFields(this._renderSymbolField(symbol, betMap));
        }

        return embed;
    }

    buildRefundedEmbed(game, bets) {
        const betMap = this._groupBets(bets);

        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Bầu cua - Refunded")
            .setDescription(
                `This game was refunded due to bot restart/crash. All placed bets were returned.\n${this._buildSeperator()}`
            );

        for (const symbol of SYMBOLS) {
            embed.addFields(this._renderSymbolField(symbol, betMap));
        }

        return embed;
    }

    _groupBets(bets) {
        const betMap = new Map();
        for (const b of bets) {
            if (!betMap.has(b.symbol)) {
                betMap.set(b.symbol, new Map());
            }
            const m = betMap.get(b.symbol);
            m.set(b.user_id, (m.get(b.user_id) || 0) + Number(b.amount));
        }

        return betMap;
    }

    _renderSymbolField(symbol, betMap) {
        const userToAmount = betMap.get(symbol.key) || new Map();
        return {
            name: `${symbol.label}`,
            value: this._renderUserBetList(userToAmount),
            inline: true,
        };
    }

    _renderUserBetList(userToAmount) {
        const entries = [...userToAmount.entries()].sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            return "-";
        }

        const maxLines = 12;
        const shown = entries.slice(0, maxLines);
        const lines = shown.map(
            ([userId, amount]) =>
                `<@${userId}> ${Number(amount)} ${config.currency.symbol}`
        );

        if (entries.length > maxLines) {
            lines.push(`...and ${entries.length - maxLines} more`);
        }

        return lines.join("\n");
    }

    _renderSummary(rows) {
        if (!rows || rows.length === 0) {
            return "No bets";
        }

        const lines = rows
            .sort((a, b) => Number(b.net_change) - Number(a.net_change))
            .map((r) => {
                const net = Number(r.net_change);
                const sign = net >= 0 ? "+" : "";
                return `<@${r.user_id}> ${sign}${net} ${config.currency.symbol}`;
            });

        return lines.slice(0, 30).join("\n");
    }

    async getStats() {
        return this.baucuaStore.getStats();
    }

    async getStats() {
        return this.baucuaStore.getStats();
    }

    buildStatsEmbed(stats) {
        const embed = new EmbedBuilder()
            .setTitle("Bầu cua - Statistics")
            .setDescription("Scope: **all servers**")
            .addFields(
                {
                    name: "Games",
                    value: `${Number(stats.games || 0)}`,
                    inline: true,
                },
                {
                    name: "Bets",
                    value: `${Number(stats.bets || 0)}`,
                    inline: true,
                },
                { name: "\u200B", value: "\u200B", inline: true },

                {
                    name: "Nai",
                    value: `${Number(stats.stag || 0)}`,
                    inline: true,
                },
                {
                    name: "Bầu",
                    value: `${Number(stats.calabash || 0)}`,
                    inline: true,
                },
                {
                    name: "Gà",
                    value: `${Number(stats.cock || 0)}`,
                    inline: true,
                },
                {
                    name: "Cá",
                    value: `${Number(stats.fish || 0)}`,
                    inline: true,
                },
                {
                    name: "Cua",
                    value: `${Number(stats.crab || 0)}`,
                    inline: true,
                },
                {
                    name: "Tôm",
                    value: `${Number(stats.prawn || 0)}`,
                    inline: true,
                }
            );

        return embed;
    }

    _buildSeperator() {
        return "-".repeat(80);
    }
}
