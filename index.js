import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import cron from "node-cron";
import { MessageHandler } from "./handlers/MessageHandler.js";
import { initializeServices } from "./services/index.js";
import { BotMessage } from "./models/BotMessage.js";

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

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    cron.schedule(
        "0 0 12 * * *",
        () => {
            const channelId = "1378428602521223219";
            const channel = client.channels.cache.get(channelId);

            channel.send({
                content:
                    "<@433996834067972098> Uhe~ Sensei, don't forget to wake me up.",
                allowedMentions: { parse: ["users"] },
            });
        },
        {
            timezone: "Asia/Bangkok",
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
