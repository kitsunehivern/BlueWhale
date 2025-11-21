import dotenv from "dotenv";

dotenv.config();

class KeyManager {
    constructor() {
        const raw = process.env.GEMINI_API_KEYS || "";
        this.keys = raw
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        if (this.keys.length === 0) {
            throw new Error("No keys found");
        }

        this.index = 0;
        this.failTimeoutMap = new Map();
        this.failDuration = Number(process.env.GEMINI_FAIL_TIMEOUT || 60000);
    }

    markFailed(key) {
        this.failTimeoutMap.set(key, Date.now() + this.failDuration);
    }

    getKey() {
        const now = Date.now();
        const total = this.keys.length;

        for (let i = 0; i < total; i++) {
            const key = this.keys[this.index];
            const disabledUntil = this.failTimeoutMap.get(key);
            this.index = (this.index + 1) % total;
            if (!disabledUntil || disabledUntil < now) {
                return key;
            }
        }

        return null;
    }
}

export default new KeyManager();
