import { GoogleGenAI } from "@google/genai";
import config from "../config.js";
import keyManager from "../utils/KeyManager.js";

export class ChatService {
    constructor(instruction) {
        this.model = config.gemini.chatModel || "gemini-2.5-flash-lite";
        this.searchModel = config.gemini.searchModel || "gemini-2.5-flash";
        this.memoryModel = config.gemini.memoryModel || "gemini-2.5-flash-lite";
        this.systemInstruction =
            instruction ||
            "You are a friendly, concise Discord chat bot. Reply in a casual style.";
        this.maxRetries = config.gemini.maxRetries || 3;
    }

    async respond(historyMessages, { userName = null, memories = [], now = null, gapMs = null } = {}) {
        if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
            console.warn("[chat] respond() called with empty history");
            return null;
        }

        const contents = [];
        for (const item of historyMessages) {
            const last = contents[contents.length - 1];
            if (last && last.role === item.role) {
                last.parts.push(...item.parts);
            } else {
                contents.push({ role: item.role, parts: [...item.parts] });
            }
        }

        const contextSection = _buildContextSection({ userName, memories, now, gapMs });
        const systemInstruction = contextSection
            ? `${this.systemInstruction}\n\n${contextSection}`
            : this.systemInstruction;

        const draftText = await this._generateWithSearch(contents, systemInstruction);

        const enrichedInstruction = draftText
            ? `${systemInstruction}\n\n[Search-grounded answer for current message]\n${draftText}`
            : systemInstruction;

        const request = {
            model: this.model,
            contents,
            config: {
                systemInstruction: enrichedInstruction
                    ? { role: "system", parts: [{ text: enrichedInstruction }] }
                    : undefined,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: { type: "string" },
                },
            },
        };

        const response = await this._generateWithRetries(request);
        if (!response) return ["..."];

        try {
            const parsed = JSON.parse(response.text || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((s) => String(s).trim()).filter(Boolean);
            }
        } catch {
            // fall through
        }

        const fallback = String(response.text || "").trim();
        return fallback ? [fallback] : ["..."];
    }

    async summarizeMemories(userName, facts) {
        const apiKey = keyManager.next();
        if (!apiKey) return facts.slice(0, 10);

        const prompt =
            `The following are all known facts about ${userName}. ` +
            `Compress them into 5-10 concise, distinct facts that preserve the most important information. ` +
            `Merge related facts. Drop trivial or redundant ones. One sentence per fact.\n\n` +
            facts.map((f, i) => `${i + 1}. ${f}`).join("\n");

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: this.memoryModel,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: "array", items: { type: "string" } },
                },
            });
            keyManager.markSuccess(apiKey);
            const parsed = JSON.parse(response.text || "[]");
            return Array.isArray(parsed) && parsed.length > 0
                ? parsed.filter(Boolean)
                : facts.slice(0, 10);
        } catch {
            return facts.slice(0, 10);
        }
    }

    async extractMemories(userName, history, existingFacts = []) {
        const apiKey = keyManager.next();
        if (!apiKey) return [];

        const conversationText = history
            .map((turn) => {
                const text = turn.parts
                    .filter((p) => p.text)
                    .map((p) => p.text)
                    .join(" ");
                const speaker = turn.role === "user" ? userName : "Hoshino";
                return `${speaker}: ${text}`;
            })
            .join("\n");

        const existingSection =
            existingFacts.length > 0
                ? `Already known about ${userName}:\n${existingFacts.map((f) => `- ${f}`).join("\n")}\n\n`
                : "";

        const prompt =
            `${existingSection}From the conversation below, extract new personal facts about ${userName} worth remembering long-term ` +
            `(preferences, hobbies, relationships, ongoing situations, important life events). ` +
            `Only include genuinely new information not already in the "already known" list. ` +
            `Keep each fact concise (one sentence). Return an empty array if nothing new is worth keeping.\n\n` +
            `Conversation:\n${conversationText}`;

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: this.memoryModel,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: "array", items: { type: "string" } },
                },
            });
            keyManager.markSuccess(apiKey);
            const parsed = JSON.parse(response.text || "[]");
            return Array.isArray(parsed) ? parsed.slice(0, 10).filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    async _generateWithSearch(contents, systemInstruction) {
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            const apiKey = keyManager.next();
            if (!apiKey) {
                console.warn("[chat] no active Gemini keys for search step");
                return null;
            }

            try {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: this.searchModel,
                    contents,
                    config: {
                        systemInstruction: systemInstruction
                            ? { role: "system", parts: [{ text: systemInstruction }] }
                            : undefined,
                        tools: [{ googleSearch: {} }],
                    },
                });
                keyManager.markSuccess(apiKey);
                return response.text?.trim() || null;
            } catch (err) {
                if (_isAuthError(err)) {
                    keyManager.markDead(apiKey);
                } else {
                    keyManager.markFailed(apiKey);
                    console.warn(`[chat] search step error (attempt ${attempt + 1}):`, err.message);
                }
            }
        }

        console.warn("[chat] search step failed after retries, proceeding without grounding");
        return null;
    }

    async _generateWithRetries(request) {
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            const apiKey = keyManager.next();
            if (!apiKey) {
                console.warn("[chat] no active Gemini keys — all cooling or dead");
                return null;
            }

            const ai = new GoogleGenAI({ apiKey });

            try {
                const response = await ai.models.generateContent(request);
                keyManager.markSuccess(apiKey);
                return response;
            } catch (err) {
                if (_isAuthError(err)) {
                    keyManager.markDead(apiKey);
                } else {
                    keyManager.markFailed(apiKey);
                    console.warn(`[chat] Gemini error (attempt ${attempt + 1}):`, err.message);
                }
            }
        }

        console.warn("[chat] exhausted retries for Gemini API");
        return null;
    }
}

function _isAuthError(err) {
    const status = err.status ?? err.statusCode ?? err.code;
    return (
        status === 401 ||
        status === 403 ||
        err.message?.includes("API_KEY_INVALID") ||
        err.message?.includes("PERMISSION_DENIED")
    );
}

function _buildContextSection({ userName, memories, now, gapMs }) {
    const lines = [];

    if (now !== null) {
        const tz = config.timezone || "UTC";
        const timeStr = new Date(now).toLocaleString("en-US", {
            timeZone: tz,
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
        lines.push(`Time: ${timeStr}`);
    }

    if (gapMs !== null && gapMs > 30 * 60 * 1000) {
        lines.push(`Last interaction: ${_formatGap(gapMs)}`);
    }

    const contextPart = lines.length > 0
        ? `[Current context]\n${lines.join("\n")}`
        : "";

    const memoryPart =
        memories.length > 0 && userName
            ? `[What you know about ${userName}]\n${memories.map((m) => `- ${m}`).join("\n")}`
            : "";

    return [contextPart, memoryPart].filter(Boolean).join("\n\n");
}

function _formatGap(ms) {
    const minutes = Math.floor(ms / 60_000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""}`;
}
