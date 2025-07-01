export class ChatHandler {
    constructor(services) {}

    async handle(botMessage, state = null) {
        return {
            text: `Respond to the message: ${botMessage.getCleanContent()}`,
        };
    }
}
