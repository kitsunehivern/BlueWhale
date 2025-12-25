import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { getErrorMessage } from "../../consts/error.js";

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

    await command.deferReply();
    try {
        const game = await services.baucuaService.startGame(
            command.channelId,
            command.user.id,
            durationSeconds
        );

        const embed = services.baucuaService.buildGameEmbed(game, []);

        const message = await command.editReply(" ", {
            embeds: [embed],
            withResponse: true,
        });

        await services.baucuaService.attachGameMessage(game.id, message.id);
    } catch (err) {
        await command.editReply(getErrorMessage(err));
    }
}
