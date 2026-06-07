import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";
import * as BaucuaPresenter from "../../presenters/BaucuaPresenter.js";

export const name = "baucua";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Start a bầu cua game in this channel")
    .addIntegerOption((o) =>
        o.setName("duration").setDescription("Betting duration in seconds").setRequired(false)
            .setMinValue(config.game.baucua.minDuration)
            .setMaxValue(config.game.baucua.maxDuration)
    );

export async function execute(ctx, services) {
    await handle(ctx, services, [ctx.options.getInteger("duration") || config.game.baucua.defaultDuration]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} baucua [duration]`;
    if (args.length > 1) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const duration = args.length > 0
            ? TokenUtils.getInteger(args[0], config.game.baucua.minDuration, config.game.baucua.maxDuration)
            : config.game.baucua.defaultDuration;

        const game = await services.baucuaService.startGame(ctx.channelId, ctx.user.id, duration);
        const embed = BaucuaPresenter.buildGameEmbed(game, []);
        const message = await ctx.reply(" ", { embeds: [embed], withResponse: true });
        await services.baucuaService.attachGameMessage(game.id, message.id);
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
