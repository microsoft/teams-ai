/**
 import {
  Card,
  TextBlock,
  ToggleInput,
  ExecuteAction,
  ActionSet,
} from "@microsoft/teams.cards";
*/

const card = new Card(
  new TextBlock('Hello world', { wrap: true, weight: 'bolder' }),
  new ToggleInput('Notify me').withId('notify'),
  new ActionSet(
    new ExecuteAction({ title: 'Submit' })
      .withData({ action: 'submit_basic' })
      .withAssociatedInputs('auto')
  )
);
