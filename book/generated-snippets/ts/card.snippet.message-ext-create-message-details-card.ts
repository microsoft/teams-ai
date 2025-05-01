export function createMessageDetailsCard(messagePayload: Message) {
  const cardElements: Element[] = [
    new TextBlock('Message Details', {
      size: 'large',
      weight: 'bolder',
      color: 'accent',
      style: 'heading',
    }),
  ];

  if (messagePayload?.body?.content) {
    cardElements.push(
      new TextBlock('Content', {
        size: 'medium',
        weight: 'bolder',
        spacing: 'medium',
      }),
      new TextBlock(messagePayload.body.content)
    );
  }

  if (messagePayload?.attachments?.length) {
    cardElements.push(
      new TextBlock('Attachments', {
        size: 'medium',
        weight: 'bolder',
        spacing: 'medium',
      }),
      new TextBlock(`Number of attachments: ${messagePayload.attachments.length}`, {
        wrap: true,
        spacing: 'small',
      })
    );
  }

  if (messagePayload?.createdDateTime) {
    cardElements.push(
      new TextBlock('Created Date', {
        size: 'medium',
        weight: 'bolder',
        spacing: 'medium',
      }),
      new TextBlock(messagePayload.createdDateTime, {
        wrap: true,
        spacing: 'small',
      })
    );
  }

  if (messagePayload?.linkToMessage) {
    cardElements.push(
      new TextBlock('Message Link', {
        size: 'medium',
        weight: 'bolder',
        spacing: 'medium',
      }),
      new ActionSet(
        new OpenUrlAction(messagePayload.linkToMessage, {
          title: 'Go to message',
        })
      )
    );
  }

  return new Card(...cardElements);
}
