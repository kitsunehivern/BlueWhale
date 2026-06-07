import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "balance";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Get a user's balance")
    .addUserOption((o) =>
        o.setName("user").setDescription("The user to check").setRequired(false)
    );

export async function execute(ctx, services) {
    const user = ctx.options.getUser("user", false) || ctx.user;
    await handle(ctx, services, [`<@${user.id}>`]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} balance [user]`;
    if (args.length > 1) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const user = args.length > 0 ? await TokenUtils.getUser(args[0]) : ctx.user;
        const balance = await services.balanceService.getUserBalance(user.id);
        const mention = user.id === ctx.user.id ? "Your" : `<@${user.id}>'s`;
        await ctx.reply(`${mention} current balance is ${balance} ${config.currency.symbol}`);
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
