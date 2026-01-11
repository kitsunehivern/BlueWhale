import { GoogleGenAI } from "@google/genai";
import config from "../config.js";
import keyManager from "../utils/KeyManager.js";

export class ChatService {
    constructor(instruction) {
        this.model = config.gemini.apiModel || "gemini-2.5-flash";
        this.systemInstruction =
            instruction ||
            "You are a friendly, concise Discord chat bot. Reply in a casual style.";
        this.maxRetries = config.gemini.maxRetries || 3;
    }

    async respond(historyMessages) {
        if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
            console.log("History messages are required");
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
                tools: [{ googleSearch: {} }],
            },
        };

        const response = await this._generateWithRetries(request);
        let replyText = "...";
        if (response) {
            replyText = String(response.text || "").trim() || "...";
        }

        return replyText;
    }

    async _generateWithRetries(request) {
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            const apiKey = keyManager.getKey();
            if (!apiKey) {
                console.log("No active Gemini API keys available");
                return null;
            }

            const ai = new GoogleGenAI({ apiKey });

            try {
                const response = await ai.models.generateContent(request);
                return response;
            } catch (err) {
                console.log("Error calling Gemini API:", err.message);
                keyManager.markFailed(apiKey);
            }
        }

        console.log("Exceeded maximum retries for Gemini API");
        return null;
    }
}
