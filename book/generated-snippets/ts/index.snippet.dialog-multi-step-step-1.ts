const dialogCard = new Card()
  .withBody(
    {
      type: 'TextBlock',
      text: 'This is a multi-step form',
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
    new SubmitAction()
      .withTitle('Submit')
      .withData({ submissiondialogtype: 'webpage_dialog_step_1' })
  );

// Return an object with the task value that renders a card
return {
  task: {
    type: 'continue',
    value: {
      title: 'Multi-step Form Dialog',
      card: cardAttachment('adaptive', dialogCard),
    },
  },
};
