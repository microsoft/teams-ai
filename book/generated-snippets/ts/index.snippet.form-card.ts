function createFormCard() {
  return new AdaptiveCard(
    new TextBlock("Please fill out the below form:", {
      wrap: true,
      style: "heading",
    }),
    new TextInput({ id: "name" })
      .withLabel("Name")
      .withPlaceholder("Enter your name"),
    new TextInput({ id: "comments" })
      .withLabel("Comments")
      .withPlaceholder("Enter your comments")
      .withIsMultiline(true),
    new ChoiceSetInput(
      { title: "Red", value: "red" },
      { title: "Green", value: "green" },
      { title: "Blue", value: "blue" }
    )
      .withId("color")
      .withLabel("Favorite Color")
      .withValue("blue"),
    new ActionSet(
      new ExecuteAction({ title: "Submit Form" })
        .withData({ action: "submit_form" })
        .withAssociatedInputs("auto")
    )
  );
}
