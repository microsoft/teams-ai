/** import { ExecuteAction } from "@microsoft/teams.cards"; */
new ExecuteAction({ title: "Submit Feedback" })
  .withData({ action: "submit_feedback" })
  .withAssociatedInputs("auto"),
