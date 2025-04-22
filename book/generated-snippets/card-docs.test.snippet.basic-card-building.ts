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
  new TextBlock(
    'Hello world',
    /** provide the options inline */ { wrap: true, weight: 'bolder' }
  ),
  new ToggleInput('Notify me')
    /** or build it */
    .withId('notify'),
  new ActionSet(new ExecuteAction({ title: 'Submit' }).withData({ action: 'submit_demo' }))
);
