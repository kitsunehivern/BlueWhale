import mysql from "mysql2/promise";
import config from "../config.js";
import { UserStore } from "./UserStore.js";
import { BaucuaStore } from "./BaucuaStore.js";
import { ChatMessageStore } from "./ChatMessageStore.js";
import { MemoryStore } from "./MemoryStore.js";

export function newStores() {
    const pool = mysql.createPool({
        host: config.mysql.host,
        port: config.mysql.port || 3306,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        ssl: false,
        timezone: "+00:00",
        supportBigNumbers: true,
        bigNumberStrings: false,
        waitForConnections: true,
        connectionLimit: 10,
    });

    return {
        userStore: new UserStore(pool),
        baucuaStore: new BaucuaStore(pool),
        chatMessageStore: new ChatMessageStore(pool),
        memoryStore: new MemoryStore(pool),
    };
}
