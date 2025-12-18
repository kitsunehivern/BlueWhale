import config from "../config.js";
import { error } from "../consts/error.js";
import { env } from "../consts/env.js";

const allow = () => ({ ok: true });
const deny = (message = "") => ({ ok: false, message });

export const runMiddlewares = async (request, middlewares) => {
    if (!request.shouldProcess()) {
        return false;
    }

    for (const mw of middlewares) {
        const res = await mw(request);
        if (!res.ok) {
            if (res.message) {
                await request.reply(res.message);
            }
            return false;
        }
    }

    return true;
};

export const mwAuthorization = async (request) => {
    if (request.user.bot) {
        return deny();
    }

    if (
        config.env !== env.PROD &&
        !config.discord.adminIds.includes(request.user.id)
    ) {
        return deny(error.NOT_AUTHORIZED_DEV_ENV);
    }

    return allow();
};

export const mwAdminCommand = async (request) => {
    if (
        config.commands.admin.includes(request.commandName) &&
        !config.discord.adminIds.includes(request.user.id)
    ) {
        return deny(error.NOT_AUTHORIZED_COMMAND);
    }

    return allow();
};
