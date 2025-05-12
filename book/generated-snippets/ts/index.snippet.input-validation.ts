function createProfileCardInputValidation() {
  const ageInput = new NumberInput({ id: "age" })
    .withLabel("Age")
    .withIsRequired(true)
    .withMin(0)
    .withMax(120);

  const nameInput = new TextInput({ id: "name" })
    .withLabel("Name")
    .withIsRequired()
    .withErrorMessage("Name is required!"); // Custom error messages
  const card = new AdaptiveCard(
    nameInput,
    ageInput,
    new TextInput({ id: "location" }).withLabel("Location"),
    new ActionSet(
      new ExecuteAction({ title: "Save" })
        .withData({
          action: "save_profile",
        })
        .withAssociatedInputs("auto") // All inputs should be validated
    )
  );

  return card;
}
