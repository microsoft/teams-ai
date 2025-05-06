# Creating Dialogs

> [!TIP]
> If you're not familiar with how to build Adaptive Cards, check out [the cards guide](../cards/README.md). Understanding their basics is a prerequisite for this guide.

## Entry Point

To open a dialog, you need to supply a special type of action as to the Adaptive Card. Once this button is clicked, the dialog will open and ask the application what to show.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-entry-point.ts }}
```
<!-- langtabs-end -->

## Handling Dialog Open Events

Once an action is executed to open a dialog, the Teams client will send an event to the agent to request what the content of the dialog should be. Here is how to handle this event:

<!-- langtabs-start -->
```typescript
app.on('dialog.open', async ({ activity }) => {
  const card: ICard = new Card()...

  // Return an object with the task value that renders a card
  return {
    task: {
      type: 'continue',
      value: {
        title: 'Title of Dialog',
        card: cardAttachment('adaptive', card),
      },
    },
  };
}
```
<!-- langtabs-end -->

### Rendering A Card

You can render an Adaptive Card in a dialog by returning a card response.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-simple-card.ts }}
```
<!-- langtabs-end -->

> [!IMPORTANT]
> The action type for submitting a dialog must be `Action.Submit`. This is a requirement of the Teams client. If you use a different action type, the dialog will not be submitted and the agent will not receive the submission event.

### Rendering A Webpage

You can render a webpage in a dialog as well. There are some security requirements to be aware of:

1. The webpage must be hosted on a domain that is allow-listed as `validDomains` in the Teams app [manifest](../../teams/manifest.md) for the agent
2. The webpage must also host the [teams-js client library](https://www.npmjs.com/package/@microsoft/teams-js). The reason for this is that for security purposes, the Teams client will not render arbitrary webpages. As such, the webpage must explicitly opt-in to being rendered in the Teams client. Setting up the teams-js client library handles this for you.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-webpage.ts }}
```
<!-- langtabs-end -->
