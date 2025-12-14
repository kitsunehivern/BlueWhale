import client from "../client.js";
import { MessageUtils } from "../utils/MessageUtils.js";

export class Message {
    constructor(message) {
        this.id = message.id;
        this.content = message.content;
        this.cleanContent = this._cleanContent(message.content);
        this.channelId = message.channelId;
        this.channelName = message.channel?.name;
        this.guildId = message.guildId;
        this.author = message.author
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
                  users: message.mentions.users.map((user) => user.id),
                  roles: message.mentions.roles.map((role) => role.id),
                  everyone: message.mentions.everyone,
              }
            : undefined;
        this.referenceId = message.reference
            ? message.reference.messageId
            : undefined;

        this._originalMessage = message;
    }

    shouldProcess() {
        return this.botWasMentioned() || this.isCommand();
    }

    async loadEmbeddings() {
        await this._loadAttachments();
        this._loadLinks();
    }

    getAttachments() {
        return this.attachments || [];
    }

    getLinks() {
        return this.links || [];
    }

    getCleanContent() {
        return this.cleanContent;
    }

    getOriginalMessage() {
        return this._originalMessage;
    }

    botWasMentioned() {
        return this.mentions.users.includes(client.user.id);
    }

    isCommand() {
        return this.getCleanContent().startsWith("=");
    }

    getBotMentionPattern(botUserId) {
        return `<@${botUserId}>`;
    }

    async reply(content, options = {}) {
        return await this._originalMessage.reply({
            content,
            allowedMentions: { users: [], roles: [] },
            ...options,
        });
    }

    async send(content, options = {}) {
        return await this._originalMessage.channel.send({
            content,
            allowedMentions: { users: [], roles: [] },
            ...options,
        });
    }

    async sendTyping() {
        return await this._originalMessage.channel.sendTyping();
    }

    async _loadAttachments() {
        if (this.attachments == null) {
            this.attachments = await MessageUtils.getAttachments(
                this._originalMessage
            );
        }
    }

    _loadLinks() {
        if (this.links == null) {
            this.links = MessageUtils.getLinks(this._originalMessage);
        }
    }

    _processAttachments(attachments) {
        return attachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            url: attachment.url,
            size: attachment.size,
            type: this._getAttachmentType(attachment.contentType),
            contentType: attachment.contentType,
        }));
    }

    _getAttachmentType(contentType) {
        if (!contentType) return "unknown";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        if (contentType.startsWith("audio/")) return "audio";
        return "file";
    }

    _cleanContent(content) {
        content = content.trim();
        if (content.startsWith(`<@${client.user.id}>`)) {
            content = content.substring(`<@${client.user.id}>`.length).trim();
        }

        return content;
    }

    getAIAttachments() {
        return this.getAttachments().map((img) => ({
            inlineData: {
                data: img.data.data.toString("base64"),
                mimeType: img.type,
            },
        }));
    }

    getAILinks() {
        return this.getLinks().map((link) => ({
            fileData: {
                fileUri: link.url,
                mimeType: link.type,
            },
        }));
    }

    getAIFormat() {
        return {
            role: this.author.id === client.user.id ? "model" : "user",
            parts: [
                { text: this.cleanContent },
                ...this.getAIAttachments(),
                ...this.getAILinks(),
            ],
        };
    }

    preview() {
        return `${this.channelName}/${this.author.username}: ${
            this.cleanContent.length > 50
                ? `${this.cleanContent.substring(0, 50)}...`
                : this.cleanContent
        }`;
    }
}
