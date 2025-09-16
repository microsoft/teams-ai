app.event('a2a:message', async ({ respond, requestContext }) => {
  logger.info(`Received message: ${requestContext.userMessage}`);
  const textInput = requestContext.userMessage.parts.filter((p): p is TextPart => p.kind === 'text').at(0)?.text;
  if (!textInput) {
    await respond('My agent currently only supports text input');
    return;
  }
  const result = await myEventHandler(textInput);
  await respond(result);
});
