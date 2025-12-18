import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give money to a user")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to give money to")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("The amount to give")
            .setRequired(true)
            .setMinValue(1)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);
    const amount = command.options.getInteger("amount", true);

    try {
        const result = await services.balanceService.giveUserBalance(
            command.user.id,
            user.id,
            amount
        );
        await command.reply(
            `You gave ${amount} ${config.currency.symbol} to <@${user.id}>, your new balance is ${result.fromBalance} ${config.currency.symbol} and <@${user.id}>'s new balance is ${result.toBalance} ${config.currency.symbol}`
        );
    } catch (err) {
        await command.reply(getErrorMessage(err));
    }
}
