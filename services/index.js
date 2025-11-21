import fs from "fs";
import { ChatService } from "./ChatService.js";
import { HistoryService } from "./HistoryService.js";

export function newServices() {
    const prompts = JSON.parse(fs.readFileSync("prompts.json"));
    const chatService = new ChatService({
        systemInstruction: prompts["Hoshino"],
    });
    const historyService = new HistoryService();
    return {
        chatService,
        historyService,
    };
}
