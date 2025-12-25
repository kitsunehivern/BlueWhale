import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward");

export async function execute(command, services) {
    await command.deferReply();
    try {
        const result = await services.balanceService.claimDailyBalance(
            command.user.id
        );

        await command.editReply(
            `You claimed ${result.amount} ${config.currency.symbol}, your new balance is ${result.balance} ${config.currency.symbol}`
        );
    } catch (err) {
        await command.editReply(getErrorMessage(err));
    }
}
