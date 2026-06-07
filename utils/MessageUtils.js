export class MessageUtils {
    static splitMessage(message, maxLength = 2000) {
        message = String(message ?? "").replace(/\r\n/g, "\n");

        const chunks = [];
        const lines = message.split("\n");

        const CODE_FENCE_RE = /^```([^\s`]*)\s*$/;

        let chunk = "";
        let inCode = false;
        let lang = "";

        const openFence = () => "```" + (lang || "") + "\n";
        const reservedCloseLen = 4;

        const pushChunk = (text) => {
            const out = text.replace(/\n+$/g, "");
            if (out.length) chunks.push(out);
        };

        const flush = () => {
            let out = chunk;
            if (inCode) {
                if (!out.endsWith("\n")) out += "\n";
                out += "```";
            }
            pushChunk(out);
            chunk = inCode ? openFence() : "";
        };

        const limitForCurrentState = () =>
            inCode ? maxLength - reservedCloseLen : maxLength;

        const appendLine = (line) => {
            let remaining = line;
            while (true) {
                const limit = limitForCurrentState();
                const needed = remaining.length + 1;

                if (chunk.length + needed <= limit) {
                    chunk += remaining + "\n";
                    return;
                }

                let available = limit - chunk.length - 1;
                if (available <= 0) {
                    flush();
                    continue;
                }

                let piece = remaining.slice(0, available);
                if (!inCode) {
                    const lastSpace = piece.lastIndexOf(" ");
                    if (lastSpace > 0) piece = piece.slice(0, lastSpace);
                }
                if (piece.length === 0) piece = remaining.slice(0, available);

                chunk += piece + "\n";
                remaining = remaining.slice(piece.length);
                if (!inCode) remaining = remaining.trimStart();

                flush();
            }
        };

        for (const line of lines) {
            const trimmed = line.trim();
            const fence = trimmed.match(CODE_FENCE_RE);

            if (fence) {
                if (chunk.length + line.length + 1 > maxLength) flush();
                if (!inCode) {
                    inCode = true;
                    lang = fence[1] || "";
                    chunk += line + "\n";
                } else {
                    chunk += line + "\n";
                    inCode = false;
                    lang = "";
                }
                continue;
            }

            if (chunk.length + line.length + 1 > limitForCurrentState()) flush();
            appendLine(line);
        }

        if (chunk.length) {
            if (inCode) {
                if (!chunk.endsWith("\n")) chunk += "\n";
                chunk += "```";
            }
            pushChunk(chunk);
        }

        return chunks;
    }

    static formatMessage(message) {
        return MessageUtils.splitMessage(message);
    }

    static tokenizeArgs(message) {
        const args = [];
        const regex = /"([^"]+)"|'([^']+)'|`([^`]+)`|(\S+)/g;
        let match;
        while ((match = regex.exec(message)) !== null) {
            args.push(match[1] || match[2] || match[3] || match[4]);
        }
        return args;
    }
}
