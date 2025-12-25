import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add money to a user's balance")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to add money to")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("The amount to add")
            .setRequired(true)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);
    const amount = command.options.getInteger("amount", true);

    await command.deferReply();
    try {
        const newBalance = await services.balanceService.addUserBalance(
            user.id,
            amount
        );

        await command.editReply(
            `You added ${amount} ${config.currency.symbol} to <@${user.id}>'s balance, their new balance is ${newBalance} ${config.currency.symbol}`
        );
    } catch (err) {
        await command.editReply(getErrorMessage(err));
    }
}
