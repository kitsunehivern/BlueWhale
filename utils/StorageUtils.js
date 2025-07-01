import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

class FileStorage {
    constructor(relativeFilePath) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.filePath = path.resolve(__dirname, "..", relativeFilePath);
        this.locked = false;
        this.queue = [];

        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async read() {
        try {
            if (!fs.existsSync(this.filePath)) return {};
            const data = await fs.promises.readFile(this.filePath, "utf8");
            return JSON.parse(data || "{}");
        } catch (err) {
            console.error(`FileStorage: Failed to read ${this.filePath}:`, err);
            return {};
        }
    }

    async write(data) {
        return new Promise((resolve, reject) => {
            this.queue.push({ data, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.locked || this.queue.length === 0) return;

        this.locked = true;
        const { data, resolve, reject } = this.queue.shift();

        try {
            const json = JSON.stringify(data, null, 2);
            await fs.promises.writeFile(this.filePath, json, "utf8");
            resolve();
        } catch (err) {
            console.error(
                `FileStorage: Failed to write ${this.filePath}:`,
                err
            );
            reject(err);
        } finally {
            this.locked = false;
            this.processQueue();
        }
    }
}

export const LeetcodeRegistrants = new FileStorage(
    "data/LeetcodeRegistrants.json"
);
