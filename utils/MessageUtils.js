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
                type: "website",
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

    static delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
