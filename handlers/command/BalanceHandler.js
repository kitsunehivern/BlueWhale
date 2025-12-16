import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../enums/error.js";

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
        await command.reply(
            `<@${user.id}>'s current balance is ${balance} ${config.currency.symbol}`
        );
    } catch (err) {
        await command.reply(getErrorMessage(err));
    }
}
