import config from "./config.js";
import {
    Client,
    ActivityType,
    GatewayIntentBits,
    PresenceUpdateStatus,
} from "discord.js";
import { Message } from "./models/Message.js";
import { MessageHandler } from "./handlers/MessageHandler.js";
import { newServices } from "./services/index.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

export default client;

const services = newServices();
const messageHandler = new MessageHandler(services);

client.once("clientReady", () => {
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
});

client.on("messageCreate", async (discordMessage) => {
    if (discordMessage.author.bot) {
        return;
    }

    const message = new Message(discordMessage);
    if (!message.botWasMentioned() && !message.isCommand()) {
        return;
    }

    await messageHandler.handle(message);
});

client.login(config.discord.token);
