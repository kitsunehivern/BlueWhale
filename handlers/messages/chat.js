import client from "../../client.js";
import attachmentCache from "../../stores/AttachmentCache.js";

export const name = "chat";

const lastRespondedAt = new Map();

const FILLER_WORDS = new Set([
    "ok", "okay", "lol", "lmao", "lmfao", "haha", "hehe", "heh",
    "nice", "cool", "wow", "hm", "hmm", "kk", "k", "ah", "oh",
    "yes", "no", "yep", "nope", "sure", "alright", "great",
    "ty", "thx", "thanks", "np", "fr", "ik", "ikr",
    "yea", "yeah", "nah", "bruh", "bro",
]);

const PURE_EMOJI_RE = /^[\p{Emoji}\s]+$/u;

function _decideResponse(text) {
    const trimmed = text.trim();
    if (!trimmed) return "skip";
    if (PURE_EMOJI_RE.test(trimmed)) return "skip";
    const words = trimmed.toLowerCase().split(/\s+/);
    if (words.length <= 3 && words.every((w) => FILLER_WORDS.has(w))) return "skip";
    return "respond";
}

export async function handle(ctx, services) {
    const { chatService, historyService, memoryService } = services;

    if (_decideResponse(ctx.cleanContent) === "skip") return;

    if (ctx.attachments?.size) {
        await attachmentCache.store(ctx.id, ctx.attachments);
    }

    const now = Date.now();
    const lastSeen = lastRespondedAt.get(ctx.user.id) ?? null;
    const gapMs = lastSeen !== null ? now - lastSeen : null;

    const [memories, history] = await Promise.all([
        memoryService.getMemories(ctx.user.id),
        historyService.getHistory(ctx.referenceId),
    ]);

    const currentParts = [{ text: ctx.cleanContent }];
    const attParts = attachmentCache.get(ctx.id);
    if (attParts) currentParts.push(...attParts);
    history.push({ role: "user", parts: currentParts });

    const messages = await chatService.respond(history, {
        userName: ctx.user.username,
        memories,
        now,
        gapMs,
    });
    if (!messages?.length) return;

    lastRespondedAt.set(ctx.user.id, now);

    await historyService.saveMessage(ctx.id, ctx.user.id, ctx.channelId, ctx.cleanContent, ctx.referenceId ?? null);

    const sent = await ctx.sendChatBubbles(messages);
    const botId = client.user.id;
    let prevId = ctx.id;
    for (const discordMsg of sent) {
        await historyService.saveMessage(discordMsg.id, botId, ctx.channelId, discordMsg.content, prevId);
        prevId = discordMsg.id;
    }

    const fullHistory = [
        ...history,
        { role: "model", parts: messages.map((m) => ({ text: m })) },
    ];
    memoryService.extractAndSave(ctx.user.id, ctx.user.username, fullHistory).catch(() => {});
}
