import config from "../config.js";

const STATE = Object.freeze({ ACTIVE: "active", COOLING: "cooling", DEAD: "dead" });

class KeyEntry {
    constructor(key) {
        this.key = key;
        this.state = STATE.ACTIVE;
        this.coolUntil = 0;
        this.failures = 0;
    }

    isAvailable(now) {
        if (this.state === STATE.DEAD) return false;
        if (this.state === STATE.COOLING && this.coolUntil > now) return false;
        return true;
    }
}

export class KeyManager {
    constructor(keys, { baseCooldown = 60_000 } = {}) {
        if (!keys?.length) throw new Error("KeyManager: no API keys provided");
        this.baseCooldown = baseCooldown;
        this.entries = keys.map((k) => new KeyEntry(k));
        this.cursor = 0;
    }

    next() {
        const now = Date.now();
        const total = this.entries.length;

        for (let i = 0; i < total; i++) {
            const entry = this.entries[this.cursor];
            this.cursor = (this.cursor + 1) % total;

            if (!entry.isAvailable(now)) continue;
            if (entry.state === STATE.COOLING) entry.state = STATE.ACTIVE;
            return entry.key;
        }

        return null;
    }

    markFailed(key) {
        const entry = this._entry(key);
        if (!entry || entry.state === STATE.DEAD) return;

        entry.failures++;
        const delay = Math.min(this.baseCooldown * 2 ** (entry.failures - 1), 10 * 60_000);
        entry.state = STATE.COOLING;
        entry.coolUntil = Date.now() + delay;

        console.warn(`[keys] ${_redact(key)} cooling for ${delay / 1000}s (failure #${entry.failures})`);
    }

    markDead(key) {
        const entry = this._entry(key);
        if (!entry) return;
        entry.state = STATE.DEAD;
        console.error(`[keys] ${_redact(key)} marked dead — check key validity`);
    }

    markSuccess(key) {
        const entry = this._entry(key);
        if (!entry || entry.state === STATE.DEAD) return;
        entry.state = STATE.ACTIVE;
        entry.failures = 0;
        entry.coolUntil = 0;
    }

    status() {
        const now = Date.now();
        return this.entries.map((e) => ({
            key: _redact(e.key),
            state: e.state === STATE.COOLING && e.coolUntil <= now ? STATE.ACTIVE : e.state,
            recoversIn: e.state === STATE.COOLING && e.coolUntil > now
                ? `${Math.ceil((e.coolUntil - now) / 1000)}s`
                : null,
            failures: e.failures,
        }));
    }

    _entry(key) {
        return this.entries.find((e) => e.key === key) ?? null;
    }
}

function _redact(key) {
    return key.slice(0, 8) + "…";
}

export default new KeyManager(
    config.gemini?.apiKeys ?? [],
    { baseCooldown: config.gemini?.failDuration ?? 60_000 }
);
