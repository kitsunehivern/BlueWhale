import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export class Middleware {
    constructor() {
        this.fns = [];
    }

    use(fn) {
        this.fns.push(fn);
        return this;
    }

    // Load every *.js file in dir as a middleware (sorted, so 01_, 02_ prefixes work).
    // Each file must have a default export that is a function.
    async load(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
        for (const file of files) {
            const mod = await import(pathToFileURL(path.join(dir, file)).href);
            if (typeof mod.default !== "function") {
                console.warn(`Middleware ${file}: no default export, skipping`);
                continue;
            }
            this.use(mod.default);
        }
        console.log(`[middleware] loaded ${this.fns.length}`);
    }

    async run(ctx) {
        for (const fn of this.fns) {
            const result = await fn(ctx);
            if (!result.ok) {
                if (result.message) await ctx.reply(result.message).catch(() => {});
                return false;
            }
        }
        return true;
    }
}
