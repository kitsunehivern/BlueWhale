export async function handleChat(request, services) {
    const history = await services.historyService.getHistory(request);
    const response = await services.chatService.respond(history);
    await request.reply(response);
}
