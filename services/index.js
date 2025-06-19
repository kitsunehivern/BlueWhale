import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchService } from "./SearchService.js";
import { HistoryService } from "./HistoryService.js";
import { ReminderService } from "./ReminderService.js";
import fs from "fs";

export function initializeServices() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const chatService = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
    });
    const imageService = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: { responseModalities: ["Text", "Image"] },
    });

    const personas = JSON.parse(fs.readFileSync("personas.json"));

    const searchService = new SearchService();
    const historyService = new HistoryService(personas);
    const reminderService = new ReminderService();

    return {
        chatService,
        imageService,
        searchService,
        historyService,
        reminderService,
        personas,
    };
}
