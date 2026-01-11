import axios from "axios";

export class MessageUtils {
    static async getAttachments(message) {
        return await Promise.all(
            message.attachments.map(async (item) => {
                const buffer = await axios.get(item.url, {
                    responseType: "arraybuffer",
                });

                return {
                    data: buffer,
                    type: item.contentType,
                };
            })
        );
    }

    static getLinks(message) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const links = message.content.match(urlRegex) || [];
        return links.map((link) => {
            return {
                url: link,
                type: "video/mp4",
            };
        });
    }

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
                const needed = remaining.length + 1; // + "\n"

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

            if (chunk.length + line.length + 1 > limitForCurrentState())
                flush();

            appendLine(line);
        }

        if (chunk.length) {
            if (inCode) {
                if (!chunk.endsWith("\n")) chunk += "\n";
                chunk += "```";
                inCode = false;
                lang = "";
            }
            pushChunk(chunk);
        }

        return chunks;
    }

    static formatMessage(message) {
        return MessageUtils.splitMessage(message);
    }

    static generateTable(data, headers = null, aligns = null) {
        if (!Array.isArray(data)) {
            throw new Error("Data must be an array");
        }

        for (const row of data) {
            if (!Array.isArray(row)) {
                throw new Error("Each row in data must be an array");
            }
        }

        for (let i = 1; i < data.length; i++) {
            if (data[i].length !== data[0].length) {
                throw new Error("All rows in data must have the same length");
            }
        }

        if (headers) {
            if (!Array.isArray(headers)) {
                throw new Error("Headers must be an array");
            }

            if (headers.length !== data[0].length) {
                throw new Error("Headers length must match data row length");
            }
        }

        if (data.length === 0 && !headers) {
            throw new Error("Both data and headers cannot be empty");
        }

        if (aligns) {
            if (!Array.isArray(aligns)) {
                throw new Error("Aligns must be an array");
            }

            if (aligns.length !== data[0].length) {
                throw new Error("Aligns length must match data row length");
            }

            for (const align of aligns) {
                if (!["l", "c", "r"].includes(align)) {
                    throw new Error("Aligns must be 'l', 'c', or 'r'");
                }
            }
        } else {
            aligns = Array(data[0].length).fill("l");
        }

        const maxColWidths = data[0].map((_, colIndex) => {
            return Math.max(
                ...data.map((row) => String(row[colIndex]).length),
                headers ? String(headers[colIndex]).length : 0
            );
        });

        const formatRow = (row) => {
            return (
                "| " +
                row
                    .map((cell, index) => {
                        const cellStr = String(cell);
                        const width = maxColWidths[index];
                        const align = aligns[index];
                        if (align === "l") {
                            return cellStr.padEnd(width);
                        } else if (align === "c") {
                            const padding = Math.floor(
                                (width - cellStr.length) / 2
                            );
                            return (
                                " ".repeat(padding) +
                                cellStr.padEnd(width - padding)
                            );
                        } else if (align === "r") {
                            return cellStr.padStart(width);
                        }
                    })
                    .join(" | ") +
                " |"
            );
        };

        const separator =
            "+-" +
            maxColWidths.map((width) => "-".repeat(width)).join("-+-") +
            "-+";

        const table = [separator];
        if (headers) {
            table.push(formatRow(headers));
            table.push(separator);
        }

        for (const row of data) {
            table.push(formatRow(row));
            table.push(separator);
        }

        return "```\n" + table.join("\n") + "\n```";
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
