import { GoogleGenAI } from "@google/genai";
import keyManager from "../utils/KeyManager.js";
import { Message } from "../models/Message.js";

export class ChatService {
    constructor(options = {}) {
        this.model =
            options.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
        this.systemInstruction =
            options.systemInstruction ||
            "You are a friendly, concise Discord chat bot. Reply in a casual style.";
        this.maxRetries = options.maxRetries ?? 3;
    }

    async respond(historyMessages) {
        if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
            console.error("History messages are required");
            return null;
        }

        const contents = historyMessages.map((m) => m.getAIFormat());
        const request = {
            model: this.model,
            contents,
            config: {
                systemInstruction: this.systemInstruction
                    ? {
                          role: "system",
                          parts: [{ text: this.systemInstruction }],
                      }
                    : undefined,
            },
        };

        const response = await this._generateWithRetries(request);
        let replyText = "(no response)";
        if (response) {
            replyText = String(response.text || "").trim() || "(no response)";
        }

        return new Message({
            content: replyText,
        });
    }

    async _generateWithRetries(request) {
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            const apiKey = keyManager.getKey();
            if (!apiKey) {
                console.error("No active Gemini API keys available");
                return null;
            }

            const ai = new GoogleGenAI({ apiKey });

            try {
                const response = await ai.models.generateContent(request);
                return response;
            } catch (err) {
                console.error("Error calling Gemini API", err);
                keyManager.markFailed(apiKey);
            }
        }

        log.error("Exceeded maximum retries for Gemini API");
        return null;
    }
}
