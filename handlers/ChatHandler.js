export class ChatHandler {
    constructor(services) {}

    async handle(botMessage) {
        return `Respond to the message: ${botMessage.getCleanContent()}`;
    }
}
