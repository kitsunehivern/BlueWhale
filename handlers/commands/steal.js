import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "steal";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Steal money from a random player (once per day)");

export async function execute(ctx, services) {
    await handle(ctx, services, []);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} steal`;
    if (args.length !== 0) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const { targetId, amount, newBalance } = await services.balanceService.stealBalance(ctx.user.id);
        await ctx.reply(
            `You stole ${amount} ${config.currency.symbol} from <@${targetId}>! Your new balance is ${newBalance} ${config.currency.symbol}`
        );
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
