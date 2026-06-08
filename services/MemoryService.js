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
            await this._compressIfNeeded(userId, userName);
        }
    }

    async _compressIfNeeded(userId, userName) {
        const count = await this.store.getActiveCount(userId);
        if (count <= 25) return;

        const allFacts = await this.store.findByUser(userId);
        const summary = await this.chatService.summarizeMemories(userName, allFacts);
        if (summary.length > 0) {
            await this.store.compress(userId, summary);
        }
    }
}
