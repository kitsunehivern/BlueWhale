import config from "../../config.js";
import { SlashCommandBuilder } from "discord.js";
import { evaluate } from "mathjs";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";

export const name = "calc";

export const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Evaluate a mathematical expression")
    .addStringOption((o) =>
        o.setName("expression").setDescription("The expression to evaluate").setRequired(true)
    );

export async function execute(ctx, services) {
    await handle(ctx, services, [ctx.options.getString("expression", true)]);
}

export async function handle(ctx, services, args) {
    const usage = `${config.command.prefix} calc <expression>`;
    if (args.length < 1) {
        await ctx.reply(error.INVALID_COMMAND_USAGE(usage));
        return;
    }

    try {
        const expression = TokenUtils.getString(args.join(""));
        const result = await Promise.race([
            new Promise((resolve, reject) => {
                try { resolve(evaluate(expression)); }
                catch (err) { reject(err); }
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(error.EVALUATION_TIMEOUT())), 1000)
            ),
        ]);

        if (typeof result === "function" || result == null) {
            await ctx.reply(error.INVALID_EXPRESSION());
            return;
        }
        await ctx.reply(String(result));
    } catch (err) {
        await ctx.reply(getErrorMessage(err));
    }
}
