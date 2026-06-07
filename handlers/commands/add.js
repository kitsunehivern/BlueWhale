import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "add";

const AMOUNT_MIN = config.currency.usage?.minAmount ?? -1_000_000_000;
const AMOUNT_MAX = config.currency.usage?.maxAmount ?? 1_000_000_000;

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Add money to a user's balance")
    .addUserOption((o) =>
        o.setName("user").setDescription("Target user").setRequired(true)
    )
    .addIntegerOption((o) =>
        o.setName("amount").setDescription("Amount to add").setRequired(true)
            .setMinValue(AMOUNT_MIN)
            .setMaxValue(AMOUNT_MAX)
    );

export async function execute(ctx, services) {
    const user = ctx.options.getUser("user", true);
    const amount = ctx.options.getInteger("amount", true);
    await handle(ctx, services, [`<@${user.id}>`, amount]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} add <user> <amount>`;
    if (args.length !== 2) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const user = await TokenUtils.getUser(args[0]);
        const amount = TokenUtils.getInteger(args[1], AMOUNT_MIN, AMOUNT_MAX);
        const newBalance = await services.balanceService.addUserBalance(user.id, amount);
        await ctx.reply(
            `You added ${amount} ${config.currency.symbol} to <@${user.id}>'s balance, their new balance is ${newBalance} ${config.currency.symbol}`
        );
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
