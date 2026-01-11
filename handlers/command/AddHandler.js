import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { sprintf } from "sprintf-js";

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
            .setMinValue(config.currency.usage.minAmount)
            .setMaxValue(config.currency.usage.maxAmount)
    );

export async function execute(command, services) {
    const user = command.options.getUser("user", true);
    const amount = command.options.getInteger("amount", true);
}

export async function handleAdd(request, services, args) {
    const usage = `${config.command.prefix} add <user> <amount>`;

    if (args.length != 2) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const user = await TokenUtils.getUser(args[0]);
        const amount = TokenUtils.getInteger(
            args[1],
            config.currency.usage.minAmount,
            config.currency.usage.maxAmount
        );

        const newBalance = await services.balanceService.addUserBalance(
            user.id,
            amount
        );

        await request.reply(
            `You added ${amount} ${config.currency.symbol} to <@${user.id}>'s balance, their new balance is ${newBalance} ${config.currency.symbol}`
        );
    } catch (err) {
        await request.reply(getErrorMessage(err));
    }
}
