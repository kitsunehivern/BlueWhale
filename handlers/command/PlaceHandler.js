import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { sprintf } from "sprintf-js";

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
                { name: "Tôm", value: "prawn" },
            ),
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("Amount to bet")
            .setMinValue(1)
            .setMaxValue(config.currency.usage.maxAmount),
    );

export async function execute(command, services) {
    const symbol = command.options.getString("symbol", true);
    const amount = command.options.getInteger("amount", false) || 1;

    await handlePlace(command, services, [symbol, amount]);
}

export async function handlePlace(request, services, args) {
    const usage = `${config.command.prefix} place <symbol> [amount]`;

    if (args.length < 1 || args.length > 2) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const symbol = TokenUtils.getString(args[0], [
            "stag",
            "calabash",
            "cock",
            "fish",
            "crab",
            "prawn",
        ]);
        const amount =
            args.length > 1
                ? TokenUtils.getInteger(
                      args[1],
                      1,
                      config.currency.usage.maxAmount,
                  )
                : 1;

        await services.baucuaService.placeBet(
            request.channelId,
            request.user.id,
            symbol,
            amount,
        );

        await request.reply(
            `You placed a bet of ${amount} ${config.currency.symbol} on ${symbol}`,
        );
    } catch (err) {
        await request.reply(getErrorMessage(err));
    }
}
