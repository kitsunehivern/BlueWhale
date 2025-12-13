import fs from "fs";
import { ChatService } from "./ChatService.js";
import { HistoryService } from "./HistoryService.js";

export function newServices() {
    const instruction = fs.readFileSync("./instruction.txt", "utf-8");
    const chatService = new ChatService({
        systemInstruction: instruction,
    });
    const historyService = new HistoryService();
    return {
        chatService,
        historyService,
    };
}
