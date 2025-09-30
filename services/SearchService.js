import axios from "axios";
import { extname } from "path";

export class SearchService {
    constructor() {}

    async searchImages(query, numImages = 3) {
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
            query
        )}&cx=${process.env.SEARCH_ENGINE_ID}&key=${
            process.env.CUSTOM_SEARCH_API
        }&searchType=image&num=${numImages}&imgType=photo&fileType=png`;
        const res = await axios.get(url);
        if (res.status !== 200) {
            return [];
        }

        let images = await Promise.all(
            res.data.items.map(async (img) => {
                try {
                    const buffer = await axios.get(img.link, {
                        responseType: "arraybuffer",
                    });

                    return {
                        data: buffer,
                        type:
                            "image/" +
                            extname(new URL(img.link).pathname).substring(1),
                    };
                } catch {
                    return null;
                }
            })
        );
        images = images.filter((img) => img !== null);

        return images;
    }
}
