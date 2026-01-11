import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { sprintf } from "sprintf-js";

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

    await handleBalance(command, services, [`<@${user.id}>`]);
}

export async function handleBalance(request, services, args) {
    const usage = `${config.command.prefix} balance [user]`;

    if (args.length > 1) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const user =
            args.length > 0 ? await TokenUtils.getUser(args[0]) : request.user;

        const balance = await services.balanceService.getUserBalance(user.id);
        const mention =
            user.id === request.user.id ? "Your" : `<@${user.id}>'s`;
        request.reply(
            `${mention} current balance is ${balance} ${config.currency.symbol}`
        );
    } catch (err) {
        request.reply(getErrorMessage(err));
    }
}
