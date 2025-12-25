export class Command {
    constructor(command) {
        this.id = command.id;
        this.commandName = command.commandName;
        this.options = command.options;
        this.channelId = command.channelId;
        this.channelName = command.channel?.name || "DM";
        this.guildId = command.guildId;
        this.user = command.user
            ? {
                  id: command.user.id,
                  username: command.user.username,
                  bot: command.user.bot,
              }
            : undefined;
        this._originalCommand = command;
    }

    shouldProcess() {
        return this._originalCommand.isChatInputCommand();
    }

    getOriginalCommand() {
        return this._originalCommand;
    }

    reply(content, options = {}) {
        return this._originalCommand.reply({
            content,
            allowedMentions: { users: [], roles: [] },
            ...options,
        });
    }

    editReply(content, options = {}) {
        return this._originalCommand.editReply({
            content,
            allowedMentions: { users: [], roles: [] },
            ...options,
        });
    }

    deferReply(options = {}) {
        return this._originalCommand.deferReply({
            ...options,
        });
    }

    preview() {
        return `${this.channelName}/${this.user.username}`;
    }
}
