import config from "../../config.js";
import { evaluate } from "mathjs";
import { SlashCommandBuilder } from "discord.js";
import { TokenUtils } from "../../utils/TokenUtils.js";
import { error, getErrorMessage } from "../../consts/error.js";
import { sprintf } from "sprintf-js";

export const data = new SlashCommandBuilder()
    .setName("calc")
    .setDescription("Evaluate a mathematical expression")
    .addStringOption((option) =>
        option
            .setName("expression")
            .setDescription("The mathematical expression to evaluate")
            .setRequired(true)
    );

export async function execute(command, services) {
    const expression = command.options.getString("expression", true);

    await handleCalc(command, services, [expression]);
}

export async function handleCalc(request, services, args) {
    const usage = `${config.command.prefix} calc <expression>`;

    if (args.length < 1) {
        request.reply(sprintf(error.INVALID_COMMAND_USAGE, usage));
        return;
    }

    try {
        const expression = TokenUtils.getString(args.join(""));

        const result = await Promise.race([
            new Promise((resolve, reject) => {
                try {
                    resolve(evaluate(expression));
                } catch (err) {
                    reject(err);
                }
            }),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error(error.EVALUATION_TIMEOUT)),
                    1000
                )
            ),
        ]);

        if (
            typeof result === "function" ||
            result === null ||
            result === undefined
        ) {
            request.reply(error.INVALID_EXPRESSION);
            return;
        }

        request.reply(String(result));
    } catch (err) {
        request.reply(getErrorMessage(err));
    }
}
