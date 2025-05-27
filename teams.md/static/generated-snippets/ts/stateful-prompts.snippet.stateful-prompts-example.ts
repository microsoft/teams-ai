/**
 * Example of a stateful conversation handler that maintains conversation history
 * using an in-memory store keyed by conversation ID.
 * @param model The chat model to use
 * @param activity The incoming activity
 * @param send Function to send an activity
 */
export const handleStatefulConversation = async (
  model: IChatModel,
  activity: IMessageActivity,
  send: (activity: ActivityLike) => Promise<any>,
  log: ILogger
) => {
  log.info('Received message', activity.text);

  // Retrieve existing conversation history or initialize new one
  const existingMessages = getOrCreateConversationHistory(activity.conversation.id);

  log.info('Existing messages before sending to prompt', existingMessages);

  // Create prompt with existing messages
  const prompt = new ChatPrompt({
    instructions: 'You are a helpful assistant.',
    model,
    messages: existingMessages, // Pass in existing conversation history
  });

  const result = await prompt.send(activity.text);

  if (result) {
    await send(
      result.content != null
        ? new MessageActivity(result.content).addAiGenerated()
        : 'I did not generate a response.'
    );
  }

  log.info('Messages after sending to prompt:', existingMessages);
};
