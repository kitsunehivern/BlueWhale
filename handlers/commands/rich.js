import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "rich";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Display the richest users")
    .addIntegerOption((o) =>
        o.setName("limit").setDescription("How many users to show").setRequired(false)
            .setMinValue(1).setMaxValue(20)
    );

export async function execute(ctx, services) {
    await handle(ctx, services, [ctx.options.getInteger("limit") || 10]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} rich [limit]`;
    if (args.length > 1) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const limit = args.length > 0 ? TokenUtils.getInteger(args[0], 1, 20) : 10;
        const richestUsers = await services.balanceService.getRichestUsers(limit);
        const lines = richestUsers.map((row, i) =>
            `${i + 1}. <@${row.userId}> - ${row.balance} ${config.currency.symbol}`
        );
        await ctx.reply(`Richest users:\n${lines.join("\n")}`);
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
