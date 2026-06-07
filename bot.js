import config from "./config.js";
import { ActivityType, PresenceUpdateStatus } from "discord.js";
import client from "./client.js";
import { newServices } from "./services/index.js";
import { MessageClassifier } from "./services/MessageClassifier.js";
import { CommandRouter } from "./core/CommandRouter.js";
import { MessageRouter } from "./core/MessageRouter.js";
import { Middleware } from "./core/Middleware.js";
import { Message } from "./models/Message.js";
import { Command } from "./models/Command.js";

export class Bot {
    constructor() {
        this.services = null;
        this.classifier = null;
        this.middleware = new Middleware();
        this.commandRouter = new CommandRouter();
        this.messageRouter = new MessageRouter();
    }

    async start() {
        this.services = newServices();
        this.classifier = new MessageClassifier(this.services);

        await this.middleware.load("middlewares");
        await this.commandRouter.load("handlers/commands");
        await this.messageRouter.load("handlers/messages");

        client.once("clientReady", () => this._onReady());
        client.on("messageCreate", (msg) => this._onMessage(msg));
        client.on("interactionCreate", (int) => this._onInteraction(int));

        await client.login(config.discord.botToken);
    }

    async _onReady() {
        console.log(`Logged in as ${client.user.tag}`);
        client.user.setPresence({
            activities: [{ name: "Sleeping with Kitsune", type: ActivityType.Custom }],
            status: PresenceUpdateStatus.Idle,
        });
        await this.commandRouter.deploy();
        await this.services.baucuaService.init();
    }

    async _onMessage(discordMessage) {
        const ctx = new Message(discordMessage);
        if (!ctx.shouldProcess()) return;
        if (!await this.middleware.run(ctx)) return;

        try {
            if (ctx.isCommand()) {
                console.log(ctx.preview());
                await this.commandRouter.routeText(ctx, this.services);
            } else {
                const category = await this.classifier.classifyMessage(ctx);
                ctx.messageName = category;
                console.log(ctx.preview());
                await this.messageRouter.route(category, ctx, this.services);
            }
        } catch (err) {
            console.log("Error handling message:", err);
            await ctx.reply("...").catch(() => {});
        }
    }

    async _onInteraction(discordInteraction) {
        const ctx = new Command(discordInteraction);
        if (!ctx.shouldProcess()) return;
        if (!await this.middleware.run(ctx)) return;

        console.log(ctx.preview());
        await ctx.sendTyping();
        try {
            await this.commandRouter.routeSlash(ctx, this.services);
        } catch (err) {
            console.log("Error handling command:", err);
            await ctx.reply("...").catch(() => {});
        }
    }
}
