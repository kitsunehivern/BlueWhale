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

    static splitMessage(message) {
        const MAX_LENGTH = 2000;
        const lines = message.split("\n");
        const chunks = [];

        let currentChunk = "";
        let insideCodeBlock = false;
        let codeBlockLang = "";

        const openCodeBlock = (lang = "") => `\`\`\`${lang}`;
        const closeCodeBlock = () => "```";

        const flushChunk = () => {
            if (currentChunk.trim()) {
                if (insideCodeBlock) currentChunk += closeCodeBlock() + "\n";
                chunks.push(currentChunk.trimEnd());
                currentChunk = insideCodeBlock
                    ? openCodeBlock(codeBlockLang) + "\n"
                    : "";
            }
        };

        for (let line of lines) {
            const trimmedLine = line.trim();

            const codeMatch = trimmedLine.match(/^```(\w*)?$/);
            if (codeMatch) {
                if (insideCodeBlock) {
                    currentChunk += line + "\n";
                    insideCodeBlock = false;
                    codeBlockLang = "";
                } else {
                    insideCodeBlock = true;
                    codeBlockLang = codeMatch[1] || "";
                    currentChunk += line + "\n";
                }
                continue;
            }

            if ((currentChunk + line + "\n").length > MAX_LENGTH) {
                flushChunk();
            }

            while (line.length > MAX_LENGTH - 10) {
                let breakPoint = line.lastIndexOf(" ", MAX_LENGTH - 10);
                if (breakPoint === -1) breakPoint = MAX_LENGTH - 10;

                let segment = line.slice(0, breakPoint);
                if (insideCodeBlock) {
                    currentChunk += segment + "\n" + closeCodeBlock();
                    chunks.push(currentChunk.trimEnd());
                    currentChunk = openCodeBlock(codeBlockLang) + "\n";
                } else {
                    chunks.push((currentChunk + segment).trimEnd());
                    currentChunk = "";
                }

                line = line.slice(breakPoint).trimStart();
            }

            currentChunk += line + "\n";
        }

        if (currentChunk.trim()) {
            if (insideCodeBlock) currentChunk += closeCodeBlock();
            chunks.push(currentChunk.trimEnd());
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

    static delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
