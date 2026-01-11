import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { sprintf } from "sprintf-js";

export const data = new SlashCommandBuilder()
    .setName("baucua")
    .setDescription("Start a bầu cua game in this channel")
    .addIntegerOption((option) =>
        option
            .setName("duration")
            .setDescription("Betting duration (seconds)")
            .setRequired(false)
            .setMinValue(config.game.baucua.minDuration)
            .setMaxValue(config.game.baucua.maxDuration)
    );

export async function execute(command, services) {
    const durationSeconds =
        command.options.getInteger("duration") ||
        config.game.baucua.defaultDuration;

    await handleBaucua(command, services, [durationSeconds]);
}

export async function handleBaucua(request, services, args) {
    const usage = `${config.command.prefix} baucua [duration]`;

    if (args.length > 1) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const durationSeconds =
            args.length > 0
                ? TokenUtils.getInteger(
                      args[0],
                      config.game.baucua.minDuration,
                      config.game.baucua.maxDuration
                  )
                : config.game.baucua.defaultDuration;

        const game = await services.baucuaService.startGame(
            request.channelId,
            request.user.id,
            durationSeconds
        );

        const embed = services.baucuaService.buildGameEmbed(game, []);

        const message = await request.reply(" ", {
            embeds: [embed],
            withResponse: true,
        });

        await services.baucuaService.attachGameMessage(game.id, message.id);
    } catch (err) {
        request.reply(getErrorMessage(err));
    }
}
