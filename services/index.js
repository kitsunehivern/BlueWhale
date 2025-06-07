import { GoogleGenerativeAI } from "@google/generative-ai";
import { HistoryService } from "./HistoryService.js";
import { ReminderService } from "./ReminderService.js";
import fs from "fs";

export function initializeServices() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const aiService = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
    });

    const personas = JSON.parse(fs.readFileSync("personas.json"));

    const historyService = new HistoryService(personas);
    const reminderService = new ReminderService();

    return {
        aiService,
        historyService,
        reminderService,
        personas,
    };
}
