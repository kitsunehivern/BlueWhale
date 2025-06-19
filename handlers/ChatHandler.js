export class ChatHandler {
    constructor(services) {}

    async handle(botMessage) {
        return {
            text: `Respond to the message: ${botMessage.getCleanContent()}`,
        };
    }
}
