import fs from "fs";
import { newStores } from "../stores/index.js";
import { ChatService } from "./ChatService.js";
import { HistoryService } from "./HistoryService.js";
import { BalanceService } from "./BalanceService.js";

export function newServices() {
    const stores = newStores();
    const chatService = new ChatService(
        fs.readFileSync("./instruction.txt", "utf-8")
    );
    const historyService = new HistoryService();
    const balanceService = new BalanceService(stores);
    return {
        chatService,
        historyService,
        balanceService,
    };
}
