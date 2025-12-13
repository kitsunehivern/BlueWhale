import config from "../config.js";

class KeyManager {
    constructor() {
        this.keys = config.gemini.keys;
        this.index = 0;
        this.failTimeoutMap = new Map();
        this.failDuration = config.gemini.timeout;
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
