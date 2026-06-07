import config from "../config.js";
import { error } from "../consts/error.js";

export default async function adminCommand(ctx) {
    const name = ctx.commandName || ctx.messageName;
    if (config.command.admin.includes(name) && !config.discord.adminIds.includes(ctx.user.id)) {
        return { ok: false, message: error.NOT_AUTHORIZED_COMMAND() };
    }
    return { ok: true };
}
