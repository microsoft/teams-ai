  /**
 import {
  AdaptiveCard,
  TextBlock,
  ToggleInput,
  ExecuteAction,
  ActionSet,
} from "@microsoft/teams.cards";
*/

  const card = new AdaptiveCard(
    new TextBlock("Hello world", { wrap: true, weight: "Bolder" }),
    new ToggleInput("Notify me").withId("notify"),
    new ActionSet(
      new ExecuteAction({ title: "Submit" })
        .withData({ action: "submit_basic" })
        .withAssociatedInputs("auto")
    )
  );
