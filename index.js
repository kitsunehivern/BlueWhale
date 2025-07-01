import { Client, ActivityType, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { MessageHandler } from "./handlers/MessageHandler.js";
import { LeetcodeHandler } from "./handlers/LeetcodeHandler.js";
import { initializeServices } from "./services/index.js";
import { BotMessage } from "./models/BotMessage.js";
import cron from "node-cron";

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

const services = initializeServices();
const messageHandler = new MessageHandler(services);
const leetcodeHandler = new LeetcodeHandler(services);

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [
            {
                name: "with Kitsune",
                type: ActivityType.Playing,
            },
        ],
        status: "online",
    });

    cron.schedule(
        "0 0 0 * * *",
        async () => {
            await leetcodeHandler.start();
        },
        {
            timezone: "UTC",
        }
    );
});

client.on("messageCreate", async (discordMessage) => {
    if (discordMessage.author.bot) {
        return;
    }

    const botMessage = new BotMessage(discordMessage);
    if (!botMessage.botWasMentioned(client.user.id)) {
        return;
    }

    await messageHandler.handleMessage(discordMessage);
});

client.login(process.env.DISCORD_TOKEN);
