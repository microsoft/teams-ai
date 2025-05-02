const sendProactiveNotification = async (userId: string) => {
  const conversationId = myConversationIdStorage.get(userId);
  if (!conversationId) {
    return;
  }
  const activity = new MessageActivity(`Hey! It's been a while. How are you?`);
  await app.send(conversationId, activity);
}
