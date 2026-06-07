import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "give";

const AMOUNT_MAX = config.currency.usage?.maxAmount ?? 1_000_000_000;

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Give money to another user")
    .addUserOption((o) =>
        o.setName("user").setDescription("Recipient").setRequired(true)
    )
    .addIntegerOption((o) =>
        o.setName("amount").setDescription("Amount to give").setRequired(true)
            .setMinValue(1).setMaxValue(AMOUNT_MAX)
    );

export async function execute(ctx, services) {
    const user = ctx.options.getUser("user", true);
    const amount = ctx.options.getInteger("amount", true);
    await handle(ctx, services, [`<@${user.id}>`, amount]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} give <user> <amount>`;
    if (args.length !== 2) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const user = await TokenUtils.getUser(args[0]);
        const amount = TokenUtils.getInteger(args[1], 1, AMOUNT_MAX);
        const result = await services.balanceService.giveUserBalance(ctx.user.id, user.id, amount);
        await ctx.reply(
            `You gave ${amount} ${config.currency.symbol} to <@${user.id}>, your new balance is ${result.fromBalance} ${config.currency.symbol} and <@${user.id}>'s new balance is ${result.toBalance} ${config.currency.symbol}`
        );
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
