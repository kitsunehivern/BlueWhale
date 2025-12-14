import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Get a user's balance")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to get the balance for")
            .setRequired(true)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);
    try {
        const balance = await services.balanceService.getUserBalance(user.id);
        await command.reply(`Balance for <@${user.id}>: \`$${balance}\``);
    } catch (error) {
        console.error("Error fetching user balance", error);
        await command.reply("Failed to fetch user balance");
    }
}
