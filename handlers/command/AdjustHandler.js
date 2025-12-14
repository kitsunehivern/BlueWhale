import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("adjust")
    .setDescription("Adjust a user's balance")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to adjust the balance for")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("The amount to adjust the balance by")
            .setRequired(true)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);
    const amount = command.options.getInteger("amount", true);

    try {
        const newBalance = await services.balanceService.adjustUserBalance(
            user.id,
            BigInt(amount)
        );
        await command.reply(
            `New balance for <@${user.id}>: \`$${newBalance}\``
        );
    } catch (error) {
        console.error("Error adjusting user balance", error);
        await command.reply("Failed to adjust user balance");
    }
}
