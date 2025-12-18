import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

export const data = new SlashCommandBuilder()
    .setName("place")
    .setDescription("Place a bet in the current game")
    .addStringOption((option) =>
        option
            .setName("symbol")
            .setDescription("Symbol to bet on")
            .setRequired(true)
            .addChoices(
                { name: "Nai", value: "stag" },
                { name: "Bầu", value: "calabash" },
                { name: "Gà", value: "cock" },
                { name: "Cá", value: "fish" },
                { name: "Cua", value: "crab" },
                { name: "Tôm", value: "prawn" }
            )
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("Amount to bet")
            .setRequired(true)
            .setMinValue(1)
    );

export async function execute(command, services) {
    const symbol = command.options.getString("symbol", true);
    const amount = command.options.getInteger("amount", true);

    try {
        await services.baucuaService.placeBet(
            command.channelId,
            command.user.id,
            symbol,
            amount
        );

        await command.reply(
            `You placed a bet of ${amount} ${config.currency.symbol} on ${symbol}`
        );
    } catch (err) {
        await command.reply(getErrorMessage(err));
    }
}
