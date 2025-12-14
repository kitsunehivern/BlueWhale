import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("richest")
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
            const bal = BigInt(row.balance);
            return `${i + 1}. <@${row.userId}> - \`$${bal}\``;
        });

        await command.reply(`Richest users:\n${lines.join("\n")}`);
    } catch (error) {
        console.error("Error fetching richest users", error);
        await command.reply("Failed to fetch richest users");
    }
}
