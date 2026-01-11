import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import config from "../config.js";
import { REST, Routes } from "discord.js";
import client from "../client.js";

export async function deployCommands() {
    await loadSlashCommands(client);
    const rest = new REST({ version: "10" }).setToken(config.discord.botToken);
    const commands = slashCommandsToJSON(client);
    await rest.put(Routes.applicationCommands(client.user.id), {
        body: commands,
    });

    console.log("Deployed global slash commands");
}

async function loadSlashCommands(client) {
    const dir = path.join("handlers", "command");
    if (!fs.existsSync(dir)) {
        console.log(`Commands directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);
    client.slashCommands = new Map();
    for (const file of files) {
        const fileUrl = pathToFileURL(path.join(dir, file)).href;
        const mod = await import(fileUrl);

        const data = mod.data;
        const execute = mod.execute;

        if (!data || typeof execute !== "function") {
            console.warn(
                `Skipping ${file}: expected exports { data, execute }`
            );
            continue;
        }

        client.slashCommands.set(data.name, { data, execute });
    }

    console.log(`Loaded ${client.slashCommands.size} slash commands`);
}

function slashCommandsToJSON(client) {
    return [...client.slashCommands.values()].map((c) => c.data.toJSON());
}
