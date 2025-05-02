app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });
  await send(`you said "${activity.text}"`);
  if (activity.from.aadObjectId && !userToConversationId.has(activity.from.aadObjectId)) {
    userToConversationId.set(activity.from.aadObjectId, activity.conversation.id);
    app.log.info(
      `Just added user ${activity.from.aadObjectId} to conversation ${activity.conversation.id}`
    );
  }
});
