app.on(
  'message',
  async ({
    send,
    activity,
  }) => {
    await send({ type: 'typing' });
    const card: ICard = new Card().withBody(new TextBlock(`Hello ${activity.from.name}`));

    await send(card);

    // Or send it with some text
    await send(new MessageActivity('Got your message!').addCard('adaptive', card));
  }
);
