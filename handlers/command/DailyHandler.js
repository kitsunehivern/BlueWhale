import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../enums/error.js";

export const data = new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward");

export async function execute(command, services) {
    try {
        const result = await services.balanceService.claimDailyBalance(
            command.author.id
        );
        console.log(result);
        await command.reply(
            `You claimed ${result.amount} ${config.currency.symbol}, your new balance is ${result.balance} ${config.currency.symbol}`
        );
    } catch (err) {
        await command.reply(getErrorMessage(err));
    }
}
