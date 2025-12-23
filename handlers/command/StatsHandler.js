import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show bầu cua statistics");

export async function execute(command, services) {
    try {
        const stats = await services.baucuaService.getStats();
        const embed = services.baucuaService.buildStatsEmbed(stats);

        await command.reply(" ", { embeds: [embed] });
    } catch (error) {
        await command.reply(getErrorMessage(error));
    }
}
