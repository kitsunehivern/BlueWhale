import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { sprintf } from "sprintf-js";

export const data = new SlashCommandBuilder()
    .setName("rich")
    .setDescription("Displays the richest users")
    .addIntegerOption((option) =>
        option
            .setName("limit")
            .setDescription("Number of richest users to display")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20)
    );

export async function execute(command, services) {
    const limit = command.options.getInteger("limit") || 10;

    await handleRich(command, services, [limit]);
}

export async function handleRich(request, services, args) {
    const usage = `${config.command.prefix} rich [limit]`;

    if (args.length > 1) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const limit =
            args.length > 0 ? TokenUtils.getInteger(args[0], 1, 20) : 10;

        const richestUsers = await services.balanceService.getRichestUsers(
            limit
        );

        const lines = richestUsers.map((row, i) => {
            return `${i + 1}. <@${row.userId}> - ${row.balance} ${
                config.currency.symbol
            }`;
        });

        await request.reply(`Richest users:\n${lines.join("\n")}`);
    } catch (err) {
        await request.reply(getErrorMessage(err));
    }
}
