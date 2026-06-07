import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { REST, Routes } from "discord.js";
import config from "../config.js";
import client from "../client.js";

// Each handler file must export:
//   name    : string          — command name (required)
//   data    : SlashCommandBuilder (optional) — registers a slash command
//   execute : async fn(ctx, services)        — slash handler
//   handle  : async fn(ctx, services, args)  — text-prefix handler
export class CommandRouter {
    constructor() {
        this.handlers = new Map();
    }

    async load(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
        for (const file of files) {
            const mod = await import(pathToFileURL(path.join(dir, file)).href);
            if (!mod.name) {
                console.warn(`Command ${file}: missing export 'name', skipping`);
                continue;
            }
            this.handlers.set(mod.name, mod);
        }
        console.log(`[commands] loaded ${this.handlers.size}`);
    }

    // Register all slash commands with Discord (call after clientReady).
    async deploy() {
        const body = [...this.handlers.values()]
            .filter((m) => m.data && m.execute)
            .map((m) => m.data.toJSON());

        const rest = new REST({ version: "10" }).setToken(config.discord.botToken);
        await rest.put(Routes.applicationCommands(client.user.id), { body });
        console.log(`[commands] deployed ${body.length} slash commands`);
    }

    async routeSlash(ctx, services) {
        const handler = this.handlers.get(ctx.commandName);
        if (!handler?.execute) {
            console.log(`[commands] no slash handler: ${ctx.commandName}`);
            return;
        }
        await handler.execute(ctx, services);
    }

    async routeText(ctx, services) {
        if (!ctx.args?.length) return;
        const handler = this.handlers.get(ctx.messageName);
        if (!handler?.handle) {
            console.log(`[commands] no text handler: ${ctx.messageName}`);
            return;
        }
        await handler.handle(ctx, services, ctx.args.slice(1));
    }
}
