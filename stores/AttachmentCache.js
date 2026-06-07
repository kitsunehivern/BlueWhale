import { LRUCache } from "lru-cache";
import client from "../client.js";

const SUPPORTED_MIMES = new Set([
    "image/jpeg", "image/jpg", "image/png", "image/gif",
    "image/webp", "image/heic", "image/heif",
    "application/pdf",
]);

const MAX_BYTES = 20 * 1024 * 1024;

export class AttachmentCache {
    constructor({ max = 200, ttl = 2 * 60 * 60 * 1000 } = {}) {
        this.cache = new LRUCache({ max, ttl });
    }

    get(messageId) {
        return this.cache.get(messageId) ?? null;
    }

    async store(messageId, discordAttachments) {
        if (!discordAttachments?.size) return;

        const parts = [];
        for (const [, att] of discordAttachments) {
            const part = await this._fetchPart(att);
            if (part) parts.push(part);
        }

        if (parts.length > 0) this.cache.set(messageId, parts);
    }

    async getOrFetch(messageId, channelId) {
        const cached = this.cache.get(messageId);
        if (cached) return cached;

        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel?.isTextBased()) return null;
            const message = await channel.messages.fetch(messageId);
            await this.store(messageId, message.attachments);
        } catch {
            // silent
        }

        return this.cache.get(messageId) ?? null;
    }

    async _fetchPart(att) {
        if (!SUPPORTED_MIMES.has(att.contentType)) return null;
        if (att.size > MAX_BYTES) {
            console.warn(`[attachments] skipping "${att.name}" — ${Math.round(att.size / 1024 / 1024)}MB exceeds 20MB limit`);
            return null;
        }

        try {
            const res = await fetch(att.url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = Buffer.from(await res.arrayBuffer()).toString("base64");
            return { inlineData: { mimeType: att.contentType, data } };
        } catch (e) {
            console.warn(`[attachments] failed to fetch "${att.name}":`, e.message);
            return null;
        }
    }
}

export default new AttachmentCache();
