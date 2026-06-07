import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// Each handler file must export:
//   name   : string                          — message category (required)
//   handle : async fn(ctx, services)         — handler function (required)
export class MessageRouter {
    constructor() {
        this.handlers = new Map();
    }

    async load(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
        for (const file of files) {
            const mod = await import(pathToFileURL(path.join(dir, file)).href);
            if (!mod.name || typeof mod.handle !== "function") {
                console.warn(`Message handler ${file}: missing 'name' or 'handle', skipping`);
                continue;
            }
            this.handlers.set(mod.name, mod.handle);
        }
        console.log(`[messages] loaded ${this.handlers.size}`);
    }

    async route(category, ctx, services) {
        const handler = this.handlers.get(category);
        if (!handler) {
            console.log(`[messages] no handler for category: ${category}`);
            return;
        }
        await handler(ctx, services);
    }
}
