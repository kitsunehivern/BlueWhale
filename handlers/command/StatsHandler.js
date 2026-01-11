import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { sprintf } from "sprintf-js";

export const data = new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show bầu cua statistics");

export async function execute(command, services) {
    await handleStats(command, services, []);
}

export async function handleStats(request, services, args) {
    const usage = `${config.command.prefix} stats`;

    if (args.length != 0) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const stats = await services.baucuaService.getStats();
        const embed = services.baucuaService.buildStatsEmbed(stats);

        await request.reply(" ", { embeds: [embed] });
    } catch (error) {
        await request.reply(getErrorMessage(error));
    }
}
