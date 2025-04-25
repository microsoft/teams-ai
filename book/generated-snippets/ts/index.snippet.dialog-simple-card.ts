if (dialogType === 'simple_form') {
  const dialogCard = new Card()
    .withBody(
      {
        type: 'TextBlock',
        text: 'This is a simple form',
        size: 'large',
        weight: 'bolder',
      },
      new TextInput()
        .withLabel('Name')
        .withRequired()
        .withId('name')
        .withPlaceholder('Enter your name')
    )
    // Inside the dialog, the card actions for submitting the card must be
    // of type Action.Submit
    .addActions(
      new SubmitAction().withTitle('Submit').withData({ submissiondialogtype: 'simple_form' })
    );

  // Return an object with the task value that renders a card
  return {
    task: {
      type: 'continue',
      value: {
        title: 'Simple Form Dialog',
        card: cardAttachment('adaptive', dialogCard),
      },
    },
  };
}
