app.on('message.ext.submit', async ({ send, activity }) => {
  const { commandId } = activity.value;
  let card: Card;

  if (commandId === 'createCard') {
    // activity.value.commandContext == "compose"
    card = createCard(activity.value.data);
  } else if (commandId === 'getMessageDetails' && activity.value.messagePayload) {
    // activity.value.commandContext == "message"
    card = createMessageDetailsCard(activity.value.messagePayload);
  } else {
    throw new Error(`Unknown commandId: ${commandId}`);
  }

  await send(card);

  return {
    status: 200,
    body: {},
  };
});
