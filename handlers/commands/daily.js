import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "daily";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Claim your daily reward");

export async function execute(ctx, services) {
    await handle(ctx, services, []);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} daily`;
    if (args.length !== 0) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const result = await services.balanceService.claimDailyBalance(ctx.user.id);
        await ctx.reply(
            `You claimed ${result.amount} ${config.currency.symbol}, your new balance is ${result.balance} ${config.currency.symbol}`
        );
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
