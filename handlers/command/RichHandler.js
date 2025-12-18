import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("rich")
    .setDescription("Displays the richest users")
    .addIntegerOption((option) =>
        option
            .setName("limit")
            .setDescription("Number of richest users to display")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20)
    );

export async function execute(command, services) {
    const limit = command.options.getInteger("limit") || 10;

    try {
        const richestUsers = await services.balanceService.getRichestUsers(
            limit
        );

        const lines = richestUsers.map((row, i) => {
            return `${i + 1}. <@${row.userId}> - ${row.balance} ${
                config.currency.symbol
            }`;
        });

        await command.reply(`Richest users:\n${lines.join("\n")}`);
    } catch (err) {
        await command.reply(getErrorMessage(err));
    }
}
