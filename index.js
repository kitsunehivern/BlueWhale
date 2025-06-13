import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
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
