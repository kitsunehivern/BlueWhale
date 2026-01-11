import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { sprintf } from "sprintf-js";

export const data = new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward");

export async function execute(command, services) {
    await handleDaily(command, services, []);
}

export async function handleDaily(request, services, args) {
    const usage = `${config.command.prefix} daily`;

    if (args.length != 0) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const result = await services.balanceService.claimDailyBalance(
            request.user.id
        );

        await request.reply(
            `You claimed ${result.amount} ${config.currency.symbol}, your new balance is ${result.balance} ${config.currency.symbol}`
        );
    } catch (err) {
        await request.reply(getErrorMessage(err));
    }
}
