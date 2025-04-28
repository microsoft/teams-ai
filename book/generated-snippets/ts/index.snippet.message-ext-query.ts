app.on('message.ext.query', async ({ activity }) => {
  const { commandId } = activity.value;
  const searchQuery = activity.value.parameters![0].value;

  if (commandId == 'searchQuery') {
    const cards = await createDummyCards(searchQuery);
    const attachments = cards.map(({card, thumbnail}) => { 
      return {
        ...cardAttachment('adaptive', card),
        preview: cardAttachment('thumbnail', thumbnail)
      }
    });

    return {
      composeExtension: {
        type: 'result',
        attachmentLayout: 'list',
        attachments: attachments
      }
    };
  }

  return {
    status: 400,
    body: {}
  };
});
