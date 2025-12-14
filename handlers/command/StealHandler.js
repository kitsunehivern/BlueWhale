import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("steal")
    .setDescription("Steal a user's balance")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to steal the balance from")
            .setRequired(true)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);

    try {
        const result = await services.balanceService.stealUserBalance(
            command.author.id,
            user.id
        );
        await command.reply(
            `Stole \`$${result.stolenAmount}\` from <@${user.id}>. Your new balance: \`$${result.thiefBalance}\`. <@${user.id}>'s new balance: \`$${result.victimBalance}\`.`
        );
    } catch (error) {
        console.error("Error stealing user balance", error);
        await command.reply("Failed to steal user balance");
    }
}
