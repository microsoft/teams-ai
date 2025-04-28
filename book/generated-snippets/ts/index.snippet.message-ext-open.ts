app.on('message.ext.open', async ({ activity, api }) => {
  const conversationId = activity.conversation.id
  const members = await api.conversations.members(conversationId).get()
  const card = createConversationMembersCard(members)

  return {
    status: 200,
    body: {
      task: {
        type: 'continue',
        value: {
          title: 'Conversation members',
          height: 'small',
          width: 'small',
          card: cardAttachment('adaptive', card),
        }
      }
    }
  }
});
