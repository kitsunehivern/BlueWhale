import config from "../config.js";
import { EmbedBuilder } from "discord.js";
import { SYMBOLS } from "../consts/baucua.js";

export function buildGameEmbed(game, bets) {
    const endsAt = Math.floor(new Date(game.ends_at).getTime() / 1000);
    const betMap = _groupBets(bets);

    const embed = new EmbedBuilder()
        .setColor(0x0000ff)
        .setTitle("Bầu cua")
        .setDescription(
            `Place bets with \`/place <symbol> <amount>\`. Round ends <t:${endsAt}:R>\n${_separator()}`
        )
        .setFooter({ text: `Channel: ${game.channel_id}` });

    for (const symbol of SYMBOLS) embed.addFields(_symbolField(symbol, betMap));

    return embed;
}

export function buildResultEmbed(game, bets, dices, summary) {
    const betMap = _groupBets(bets);
    const diceLabels = dices
        .map((k) => SYMBOLS.find((s) => s.key === k)?.label ?? k)
        .join(", ");

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("Bầu cua - Result")
        .setDescription(
            `**Dice**: ${diceLabels}\n**Payouts**:\n${_renderSummary(summary)}\n${_separator()}`
        );

    for (const symbol of SYMBOLS) embed.addFields(_symbolField(symbol, betMap));

    return embed;
}

export function buildRefundedEmbed(game, bets) {
    const betMap = _groupBets(bets);

    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Bầu cua - Refunded")
        .setDescription(
            `This game was refunded due to bot restart/crash. All placed bets were returned.\n${_separator()}`
        );

    for (const symbol of SYMBOLS) embed.addFields(_symbolField(symbol, betMap));

    return embed;
}

export function buildStatsEmbed(stats) {
    return new EmbedBuilder()
        .setTitle("Bầu cua - Statistics")
        .setDescription("Scope: **all servers**")
        .addFields(
            { name: "Games",  value: `${stats.games}`,    inline: true },
            { name: "Bets",   value: `${stats.bets}`,     inline: true },
            { name: "​", value: "​",             inline: true },
            { name: "Nai",    value: `${stats.stag}`,     inline: true },
            { name: "Bầu",    value: `${stats.calabash}`, inline: true },
            { name: "Gà",     value: `${stats.cock}`,     inline: true },
            { name: "Cá",     value: `${stats.fish}`,     inline: true },
            { name: "Cua",    value: `${stats.crab}`,     inline: true },
            { name: "Tôm",    value: `${stats.prawn}`,    inline: true },
        );
}

function _groupBets(bets) {
    const betMap = new Map();
    for (const b of bets) {
        if (!betMap.has(b.symbol)) betMap.set(b.symbol, new Map());
        const m = betMap.get(b.symbol);
        m.set(b.user_id, (m.get(b.user_id) || 0) + Number(b.amount));
    }
    return betMap;
}

function _symbolField(symbol, betMap) {
    return {
        name: symbol.label,
        value: _renderBetList(betMap.get(symbol.key) ?? new Map()),
        inline: true,
    };
}

function _renderBetList(userToAmount) {
    const entries = [...userToAmount.entries()].sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return "-";

    const MAX = 12;
    const lines = entries
        .slice(0, MAX)
        .map(([userId, amount]) => `<@${userId}> ${amount} ${config.currency.symbol}`);

    if (entries.length > MAX) lines.push(`...and ${entries.length - MAX} more`);

    return lines.join("\n");
}

function _renderSummary(rows) {
    if (!rows?.length) return "No bets";

    return rows
        .sort((a, b) => Number(b.net_change) - Number(a.net_change))
        .slice(0, 30)
        .map((r) => {
            const net = Number(r.net_change);
            return `<@${r.user_id}> ${net >= 0 ? "+" : ""}${net} ${config.currency.symbol}`;
        })
        .join("\n");
}

function _separator() {
    return "-".repeat(80);
}
