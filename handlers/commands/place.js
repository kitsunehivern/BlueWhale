import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { SYMBOLS } from "../../consts/baucua.js";

const SYMBOL_KEYS = SYMBOLS.map((s) => s.key);
const AMOUNT_MAX = config.currency.usage?.maxAmount ?? 1_000_000_000;

export const name = "place";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Place a bet in the current game")
    .addStringOption((o) =>
        o.setName("symbol").setDescription("Symbol to bet on").setRequired(true)
            .addChoices(...SYMBOLS.map((s) => ({ name: s.label, value: s.key })))
    )
    .addIntegerOption((o) =>
        o.setName("amount").setDescription("Amount to bet")
            .setMinValue(1).setMaxValue(AMOUNT_MAX)
    );

export async function execute(ctx, services) {
    const symbol = ctx.options.getString("symbol", true);
    const amount = ctx.options.getInteger("amount", false) || 1;
    await handle(ctx, services, [symbol, amount]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} place <symbol> [amount]`;
    if (args.length < 1 || args.length > 2) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const symbol = TokenUtils.getString(args[0], SYMBOL_KEYS);
        const amount = args.length > 1 ? TokenUtils.getInteger(args[1], 1, AMOUNT_MAX) : 1;
        await services.baucuaService.placeBet(ctx.channelId, ctx.user.id, symbol, amount);
        await ctx.reply(`You placed a bet of ${amount} ${config.currency.symbol} on ${symbol}`);
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
