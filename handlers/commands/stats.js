import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import * as BaucuaPresenter from "../../presenters/BaucuaPresenter.js";

export const name = "stats";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Show bầu cua statistics");

export async function execute(ctx, services) {
    await handle(ctx, services, []);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} stats`;
    if (args.length !== 0) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const stats = await services.baucuaService.getStats();
        const embed = BaucuaPresenter.buildStatsEmbed(stats);
        await ctx.reply(" ", { embeds: [embed] });
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
