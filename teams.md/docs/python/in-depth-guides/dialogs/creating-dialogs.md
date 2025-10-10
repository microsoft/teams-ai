---
sidebar_position: 1
summary: Guide to creating and handling dialogs in Teams applications, covering dialog opening mechanisms, content rendering using Adaptive Cards or webpages, and security considerations for web content integration.
---


# Creating Dialogs

:::tip
If you're not familiar with how to build Adaptive Cards, check out [the cards guide](../adaptive-cards). Understanding their basics is a prerequisite for this guide.
:::

## Entry Point

To open a dialog, you need to supply a special type of action as to the Adaptive Card. Once this button is clicked, the dialog will open and ask the application what to show.

```python
from microsoft.teams.api import MessageActivity, MessageActivityInput, TypingActivityInput
from microsoft.teams.apps import ActivityContext
from microsoft.teams.cards import (
    AdaptiveCard,
    SubmitAction,
    SubmitActionData,
    TaskFetchSubmitActionData,
    TextBlock
)
# ...

@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    await ctx.reply(TypingActivityInput())

    # Create the launcher adaptive card using fluent API
    # The ms_teams field will serialize to 'msteams' with type 'task/fetch'
    card = (
        AdaptiveCard(version="1.4")
        .with_body([
            TextBlock(text="Select the examples you want to see!", size="Large", weight="Bolder")
        ])
        .with_actions([
            SubmitAction(title="Webpage Dialog")
            .with_data(
                SubmitActionData(opendialogtype="webpage_dialog")
                .with_ms_teams(TaskFetchSubmitActionData().model_dump())
            ),
            SubmitAction(title="Multi-step Form")
            .with_data(
                SubmitActionData(opendialogtype="multi_step_form")
                .with_ms_teams(TaskFetchSubmitActionData().model_dump())
            ),
            SubmitAction(title="Mixed Example")
            .with_data(
                SubmitActionData(opendialogtype="mixed_example")
                .with_ms_teams(TaskFetchSubmitActionData().model_dump())
            ),
        ])
    )

    # Send the card as an attachment
    message = MessageActivityInput(text="Enter this form").add_card(card)
    await ctx.send(message)
```

## Handling Dialog Open Events

Once an action is executed to open a dialog, the Teams client will send an event to the agent to request what the content of the dialog should be. Here is how to handle this event:

```python
@app.on_dialog_open
async def handle_dialog_open(ctx: ActivityContext[TaskFetchInvokeActivity]):
    """Handle dialog open events for all dialog types."""
    card = AdaptiveCard(...)
    
    # Return an object with the task value that renders a card
    return InvokeResponse(
                body=TaskModuleResponse(
                    task=TaskModuleContinueResponse(
                        value=CardTaskModuleTaskInfo(
                            title="Title of Dialog",
                            card=card_attachment(AdaptiveCardAttachment(content=card)),
                        )
                    )
                )
            )
```

### Rendering A Card

You can render an Adaptive Card in a dialog by returning a card response.

```python
from microsoft.teams.api import AdaptiveCardAttachment, TaskFetchInvokeActivity, InvokeResponse, card_attachment
from microsoft.teams.api import CardTaskModuleTaskInfo, TaskModuleContinueResponse, TaskModuleResponse
from microsoft.teams.apps import ActivityContext
from microsoft.teams.cards import AdaptiveCard, TextBlock, TextInput, SubmitAction, SubmitActionData
# ...

@app.on_dialog_open
async def handle_dialog_open(ctx: ActivityContext[TaskFetchInvokeActivity]):
    """Handle dialog open events for all dialog types."""
    # Use with_data() to attach submission metadata
    # SubmitActionData uses extra="allow" to accept custom fields
    submission_data = SubmitActionData.model_validate({"submissiondialogtype": "simple_form"})

    # Create dialog card using fluent API
    dialog_card = (
        AdaptiveCard(version="1.4")
        .with_body([
            TextBlock(text="This is a simple form", size="Large", weight="Bolder"),
            TextInput().with_label("Name").with_is_required(True).with_id("name").with_placeholder("Enter your name"),
        ])
        .with_actions([
            SubmitAction(title="Submit").with_data(submission_data)
        ])
    )

    # Return an object with the task value that renders a card
    return InvokeResponse(
                body=TaskModuleResponse(
                    task=TaskModuleContinueResponse(
                        value=CardTaskModuleTaskInfo(
                            title="Simple Form Dialog",
                            card=card_attachment(AdaptiveCardAttachment(content=dialog_card)),
                        )
                    )
                )
            )
```

:::info
The action type for submitting a dialog must be `Action.Submit`. This is a requirement of the Teams client. If you use a different action type, the dialog will not be submitted and the agent will not receive the submission event.
:::

### Rendering A Webpage

You can render a webpage in a dialog as well. There are some security requirements to be aware of:

1. The webpage must be hosted on a domain that is allow-listed as `validDomains` in the Teams app [manifest](/teams/deployment/manifest) for the agent
2. The webpage must also host the [teams-js client library](https://www.npmjs.com/package/@microsoft/teams-js). The reason for this is that for security purposes, the Teams client will not render arbitrary webpages. As such, the webpage must explicitly opt-in to being rendered in the Teams client. Setting up the teams-js client library handles this for you.

```python
import os
from microsoft.teams.api import InvokeResponse, TaskModuleContinueResponse, TaskModuleResponse, UrlTaskModuleTaskInfo
# ...

return InvokeResponse(
                body=TaskModuleResponse(
                    task=TaskModuleContinueResponse(
                        value=UrlTaskModuleTaskInfo(
                            title="Webpage Dialog",
                            # Here we are using a webpage that is hosted in the same
                            # server as the agent. This server needs to be publicly accessible,
                            # needs to set up teams.js client library (https://www.npmjs.com/package/@microsoft/teams-js)
                            # and needs to be registered in the manifest.
                            url=f"{os.getenv('BOT_ENDPOINT')}/tabs/dialog-webpage",
                            width=1000,
                            height=800,
                        )
                    )
                )
            )
```
