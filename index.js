import dotenv from "dotenv";
import { Client, ActivityType, GatewayIntentBits } from "discord.js";
import { Message } from "./models/Message.js";
import { MessageHandler } from "./handlers/MessageHandler.js";
import { newServices } from "./services/index.js";

dotenv.config();

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
                type: ActivityType.Watching,
            },
        ],
        status: "online",
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

client.login(process.env.DISCORD_TOKEN);
