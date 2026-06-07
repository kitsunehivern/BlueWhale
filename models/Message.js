import config from "../config.js";
import client from "../client.js";
import { MessageUtils } from "../utils/MessageUtils.js";

export class Message {
    constructor(message) {
        this.id = message.id;
        this.content = message.content;
        this.cleanContent = this._cleanContent(message.content);
        this.channelId = message.channelId;
        this.channelName = message.channel?.name || "DM";
        this.guildId = message.guildId;
        this.user = message.author
            ? {
                  id: message.author.id,
                  username: message.author.username,
                  bot: message.author.bot,
              }
            : undefined;
        this.timestamp = message.createdTimestamp;
        this.editedTimestamp = message.editedTimestamp;
        this.mentions = message.mentions
            ? {
                  users: message.mentions.users.map((u) => u.id),
                  roles: message.mentions.roles.map((r) => r.id),
                  everyone: message.mentions.everyone,
              }
            : undefined;
        this.referenceId = message.reference?.messageId;
        this.attachments = message.attachments ?? null;
        this._originalMessage = message;

        if (this.isCommand()) {
            this.args = MessageUtils.tokenizeArgs(
                this.cleanContent.slice(config.command.prefix.length)
            );
            this.messageName = this.args.length > 0 ? this.args[0].toLowerCase() : null;
        }
    }

    shouldProcess() {
        return this.botWasMentioned() || this.isCommand();
    }

    botWasMentioned() {
        return this.mentions.users.includes(client.user.id);
    }

    isCommand() {
        return this.cleanContent.startsWith(config.command.prefix);
    }

    async sendChatBubbles(messages) {
        const sent = [];
        for (let i = 0; i < messages.length; i++) {
            await this._typingDelay(messages[i], i === 0);
            const discordMsg =
                i === 0
                    ? await this._originalMessage.reply({
                          content: messages[i],
                          allowedMentions: { users: [], roles: [] },
                      })
                    : await this._originalMessage.channel.send({
                          content: messages[i],
                          allowedMentions: { users: [], roles: [] },
                      });
            sent.push(discordMsg);
        }
        return sent;
    }

    async reply(content, options = {}) {
        const chunks = MessageUtils.formatMessage(content);
        let lastMessage = this._originalMessage;
        for (let i = 0; i < chunks.length; i++) {
            await this.sendTyping();
            lastMessage = await lastMessage.reply({
                content: chunks[i],
                allowedMentions: { users: [], roles: [] },
                ...(i === chunks.length - 1 ? options : {}),
            });
        }
        return lastMessage;
    }

    async send(content, options = {}) {
        const chunks = MessageUtils.formatMessage(content);
        let lastMessage = null;
        for (let i = 0; i < chunks.length; i++) {
            await this.sendTyping();
            lastMessage = await this._originalMessage.channel.send({
                content: chunks[i],
                allowedMentions: { users: [], roles: [] },
                ...(i === chunks.length - 1 ? options : {}),
            });
        }
        return lastMessage;
    }

    async sendTyping() {
        return this._originalMessage.channel.sendTyping();
    }

    preview() {
        const text = this.cleanContent.length > 100
            ? `${this.cleanContent.slice(0, 100)}...`
            : this.cleanContent;
        return `[${this.messageName ?? "message"}] ${this.channelName}/${this.user.username}: ${text}`;
    }

    async _typingDelay(text, isFirst = true) {
        const typeMs = Math.min(text.length * 40, 3000) + Math.random() * 400;
        const thinkMs = isFirst
            ? 400 + Math.random() * 600
            : 100 + Math.random() * 250;
        const total = Math.round(thinkMs + typeMs);

        await this._originalMessage.channel.sendTyping();
        if (total > 8000) {
            await new Promise((r) => setTimeout(r, 7500));
            await this._originalMessage.channel.sendTyping();
            await new Promise((r) => setTimeout(r, total - 7500));
        } else {
            await new Promise((r) => setTimeout(r, total));
        }
    }

    _cleanContent(content) {
        content = content.trim();
        if (content.startsWith(`<@${client.user.id}>`)) {
            content = content.slice(`<@${client.user.id}>`.length).trim();
        }
        return content;
    }
}
