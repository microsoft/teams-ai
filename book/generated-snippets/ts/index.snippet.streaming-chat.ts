app.on('message', async ({ stream, send, activity, next }) => {
  // const query = activity.text;

  const prompt = new ChatPrompt({
    instructions: 'You are a friendly assistant who responds on wordy prose',
    model,
  });

  // Notice that we don't `send` the final response back, but
  // `stream` the chunks as they come in
  const response = await prompt.send(query, {
    onChunk: (chunk) => {
      stream.emit(chunk);
    },
  });

  if (activity.conversation.isGroup && response.content) {
    // If the conversation is a group chat, we need to send the final response
    // back to the group chat
    await send(response.content);
  }
});
