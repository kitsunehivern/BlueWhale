import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    if (message.content === "hoxilo") {
        message.channel.send(`Uh${"e".repeat(parseInt(Math.random() * 10))}!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
