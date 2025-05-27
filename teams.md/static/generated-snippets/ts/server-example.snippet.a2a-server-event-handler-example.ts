app.event('a2a:message', async ({ respond, taskContext }) => {
    logger.info(`Received message: ${taskContext.userMessage}`);
    const textInput = taskContext.userMessage.parts.filter(p => p.type === 'text').at(0)?.text;
    if (!textInput) {
        await respond({
            'state': 'failed',
            'parts': [
                {
                    type: 'text',
                    text: 'My agent currently only supports text input'
                }
            ]
        })
        return;
    }
    const result: string | TaskUpdate = await myEventHandler(textInput);
    await respond(result);
});
