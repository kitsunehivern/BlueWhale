import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Get a user's balance")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to get the balance for")
            .setRequired(false)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", false) || command.user;
    const mention = user.id === command.user.id ? "Your" : `<@${user.id}>'s`;

    await command.deferReply();
    try {
        const balance = await services.balanceService.getUserBalance(user.id);

        await command.editReply(
            `${mention} current balance is ${balance} ${config.currency.symbol}`
        );
    } catch (err) {
        await command.editReply(getErrorMessage(err));
    }
}
