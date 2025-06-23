import client from "../index.js";
import { MessageUtils } from "../utils/MessageUtils.js";

export class BotMessage {
    constructor(discordMessage) {
        this.id = discordMessage.id;
        this.content = discordMessage.content;
        this.channelId = discordMessage.channelId;
        this.channelName = discordMessage.channel.name;
        this.guildId = discordMessage.guildId;
        this.author = {
            id: discordMessage.author.id,
            username: discordMessage.author.username,
            displayName: discordMessage.author.displayName,
            bot: discordMessage.author.bot,
        };
        this.timestamp = discordMessage.createdTimestamp;
        this.editedTimestamp = discordMessage.editedTimestamp;
        this.mentions = {
            users: discordMessage.mentions.users.map((user) => user.id),
            roles: discordMessage.mentions.roles.map((role) => role.id),
            everyone: discordMessage.mentions.everyone,
        };

        this._originalMessage = discordMessage;

        this.attachments = null;
        this.links = null;
        this.cleanContent = this._cleanContent(discordMessage.content);
    }

    async loadAttachments() {
        if (this.attachments === null) {
            this.attachments = await MessageUtils.getAttachments(
                this._originalMessage
            );
        }
        return this.attachments;
    }

    loadLinks() {
        if (this.links === null) {
            this.links = MessageUtils.getLinks(this._originalMessage);
        }
        return this.links;
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

    botWasMentioned(botUserId) {
        return this.mentions.users.includes(botUserId);
    }

    getBotMentionPattern(botUserId) {
        return `<@${botUserId}>`;
    }

    async reply(content, options = {}) {
        return await this._originalMessage.reply({
            content,
            allowedMentions: { repliedUser: false, parse: ["users"] },
            ...options,
        });
    }

    async send(content, options = {}) {
        return await this._originalMessage.channel.send({
            content,
            allowedMentions: { parse: ["users"] },
            ...options,
        });
    }

    async sendTyping() {
        return await this._originalMessage.channel.sendTyping();
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

    toAIFormat() {
        return {
            role: "user",
            parts: [
                { text: this.content },
                ...this.getAIAttachments(),
                // no using links in history for now
                // ...this.getAILinks(),
            ],
        };
    }

    toString() {
        return `${this.channelName}/${this.author.username}: ${
            this.content.length > 50
                ? `${this.content.substring(0, 50)}...`
                : this.cleanContent
        }`;
    }
}
