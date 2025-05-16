if (dialogType === "simple_form") {
  const dialogCard = new AdaptiveCard(
    {
      type: "TextBlock",
      text: "This is a simple form",
      size: "Large",
      weight: "Bolder",
    },
    new TextInput()
      .withLabel("Name")
      .withIsRequired()
      .withId("name")
      .withPlaceholder("Enter your name")
  )
    // Inside the dialog, the card actions for submitting the card must be
    // of type Action.Submit
    .withActions(
      new SubmitAction()
        .withTitle("Submit")
        .withData({ submissiondialogtype: "simple_form" })
    );

  // Return an object with the task value that renders a card
  return {
    task: {
      type: "continue",
      value: {
        title: "Simple Form Dialog",
        card: cardAttachment("adaptive", dialogCard),
      },
    },
  };
}
