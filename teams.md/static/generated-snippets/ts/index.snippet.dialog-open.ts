app.on('dialog.open', async ({ activity }) => {
  const card: IAdaptiveCard = new AdaptiveCard()...

  // Return an object with the task value that renders a card
  return {
    task: {
      type: 'continue',
      value: {
        title: 'Title of Dialog',
        card: cardAttachment('adaptive', card),
      },
    },
  };
}
