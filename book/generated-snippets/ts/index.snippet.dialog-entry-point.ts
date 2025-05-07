app.on("message", async ({ send }) => {
  await send({ type: "typing" });

  // Create the launcher adaptive card
  const card: IAdaptiveCard = new AdaptiveCard({
    type: "TextBlock",
    text: "Select the examples you want to see!",
    size: "Large",
    weight: "Bolder",
  }).withActions(
    // raw action
    {
      type: "Action.Submit",
      title: "Simple form test",
      data: {
        msteams: {
          type: "task/fetch",
        },
        opendialogtype: "simple_form",
      },
    },
    // Special type of action to open a dialog
    new TaskFetchAction({})
      .withTitle("Webpage Dialog")
      // This data will be passed back in an event so we can
      // handle what to show in the dialog
      .withValue(new TaskFetchData({ opendialogtype: "webpage_dialog" })),
    new TaskFetchAction({})
      .withTitle("Multi-step Form")
      .withValue(new TaskFetchData({ opendialogtype: "multi_step_form" })),
    new TaskFetchAction({})
      .withTitle("Mixed Example")
      .withValue(new TaskFetchData({ opendialogtype: "mixed_example" }))
  );

  // Send the card as an attachment
  await send(new MessageActivity("Enter this form").addCard("adaptive", card));
});
