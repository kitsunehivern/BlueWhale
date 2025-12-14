import config from "../config.js";
import client from "../client.js";

export class CommandHandler {
    constructor(services) {
        this.services = services;
    }

    async handle(command) {
        console.log(`[${command.commandName}] ${command.preview()}`);

        const cmd = client.slashCommands.get(command.commandName);
        if (!cmd) {
            return;
        }

        try {
            await cmd.execute(command, this.services);
        } catch (err) {
            console.error("Error handling command", err);
            try {
                if (command.deferred || command.replied) {
                    await command.editReply("...");
                } else {
                    await command.reply("...");
                }
            } catch (replyErr) {
                console.error("Failed to reply to command error", replyErr);
            }
        }
    }
}
