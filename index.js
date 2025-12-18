import config from "./config.js";
import { ActivityType, PresenceUpdateStatus } from "discord.js";
import client from "./client.js";
import {
    runMiddlewares,
    mwAuthorization,
    mwAdminCommand,
} from "./middlewares/index.js";
import { Message } from "./models/Message.js";
import { Command } from "./models/Command.js";
import { newServices } from "./services/index.js";
import { MessageHandler } from "./handlers/MessageHandler.js";
import { CommandHandler } from "./handlers/CommandHandler.js";
import { deployCommands } from "./scripts/index.js";

const services = newServices();
const messageHandler = new MessageHandler(services);
const commandHandler = new CommandHandler(services);

client.once("clientReady", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [
            {
                name: "Sleeping with Kitsune",
                type: ActivityType.Custom,
            },
        ],
        status: PresenceUpdateStatus.Idle,
    });

    await deployCommands();
    await services.baucuaService.init();
});

client.on("messageCreate", async (discordMessage) => {
    const message = new Message(discordMessage);

    const ok = await runMiddlewares(message, [mwAuthorization]);
    if (!ok) {
        return;
    }

    await messageHandler.handle(message);
});

client.on("interactionCreate", async (discordCommand) => {
    const command = new Command(discordCommand);

    const ok = await runMiddlewares(command, [mwAuthorization, mwAdminCommand]);
    if (!ok) {
        return;
    }

    await commandHandler.handle(command);
});

client.login(config.discord.botToken);
