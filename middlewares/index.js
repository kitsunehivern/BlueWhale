import config from "../config.js";

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

export const ensureAccess = async (request) => {
    if (config.env === "prod") {
        return allow();
    }

    if (request.author.bot) {
        return deny();
    }

    if (request.author.id !== config.discord.ownerId) {
        return deny("Access denied!");
    }

    return allow();
};
