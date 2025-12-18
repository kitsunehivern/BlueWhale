import fs from "fs";
import { newStores } from "../stores/index.js";
import { ChatService } from "./ChatService.js";
import { HistoryService } from "./HistoryService.js";
import { BalanceService } from "./BalanceService.js";
import { BaucuaService } from "./BaucuaService.js";

export function newServices() {
    const stores = newStores();
    const chatService = new ChatService(
        fs.readFileSync("./instruction.txt", "utf-8")
    );
    const historyService = new HistoryService();
    const balanceService = new BalanceService(stores);
    const baucuaService = new BaucuaService(stores);
    return {
        chatService,
        historyService,
        balanceService,
        baucuaService,
    };
}
