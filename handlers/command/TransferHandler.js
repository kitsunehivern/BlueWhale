import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("Transfer balance to another user")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to transfer balance to")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("The amount to transfer")
            .setRequired(true)
            .setMinValue(1)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);
    const amount = command.options.getInteger("amount", true);

    try {
        const result = await services.balanceService.transferUserBalance(
            command.author.id,
            user.id,
            BigInt(amount)
        );
        await command.reply(
            `Transferred \`$${amount}\` to <@${user.id}>. Your new balance: \`$${result.fromBalance}\`. <@${user.id}>'s new balance: \`$${result.toBalance}\`.`
        );
    } catch (error) {
        console.error("Error transferring user balance", error);
        await command.reply("Failed to transfer user balance");
    }
}
