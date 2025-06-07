import { MessageUtils } from "../utils/MessageUtils.js";

export class BotMessage {
    constructor(discordMessage) {
        this.id = discordMessage.id;
        this.content = discordMessage.content;
        this.channelId = discordMessage.channelId;
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

        this.images = null;
        this.attachments = this._processAttachments(discordMessage.attachments);
        this.cleanContent = this._cleanContent(discordMessage.content);
    }

    async loadImages() {
        if (this.images === null) {
            this.images = await MessageUtils.getImages(this._originalMessage);
        }
        return this.images;
    }

    getImages() {
        return this.images || [];
    }

    hasImages() {
        return this.attachments.some((att) => att.type === "image");
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
        return content
            .replace(/<@!?\d+>/g, "") // Remove user mentions
            .replace(/<@&\d+>/g, "") // Remove role mentions
            .replace(/<#\d+>/g, "") // Remove channel mentions
            .trim();
    }

    toAIFormat() {
        return {
            role: "user",
            parts: [
                { text: this.content },
                ...this.getImages().map((img) => ({
                    inlineData: {
                        data: img.data,
                        mimeType: img.type,
                    },
                })),
            ],
        };
    }

    toString() {
        return `Message(${this.author.username}: ${this.content.substring(
            0,
            50
        )}...)`;
    }
}
