import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show bầu cua statistics");

export async function execute(command, services) {
    await command.deferReply();
    try {
        const stats = await services.baucuaService.getStats();
        const embed = services.baucuaService.buildStatsEmbed(stats);

        await command.editReply(" ", { embeds: [embed] });
    } catch (error) {
        await command.editReply(getErrorMessage(error));
    }
}
