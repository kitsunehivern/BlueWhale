import config from "../config.js";
import { error } from "../consts/error.js";
import { env } from "../consts/env.js";

export default async function authorization(ctx) {
    if (ctx.user.bot) return { ok: false };

    if (config.env !== env.PROD && !config.discord.adminIds.includes(ctx.user.id)) {
        return { ok: false, message: error.NOT_AUTHORIZED_DEV_ENV() };
    }

    return { ok: true };
}
