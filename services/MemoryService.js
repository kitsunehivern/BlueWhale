export class MemoryService {
    constructor(memoryStore, chatService) {
        this.store = memoryStore;
        this.chatService = chatService;
    }

    async getMemories(userId) {
        return this.store.findByUser(userId);
    }

    async extractAndSave(userId, userName, history) {
        const existingFacts = await this.store.findByUser(userId);
        const newFacts = await this.chatService.extractMemories(userName, history, existingFacts);
        if (newFacts.length > 0) {
            await this.store.addFacts(userId, newFacts);
        }
    }
}
