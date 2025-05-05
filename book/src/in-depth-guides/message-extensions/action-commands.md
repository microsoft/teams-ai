# Action commands

Action commands allow you to present your users with a modal pop-up called a dialog in Teams. The dialog collects or displays information, processes the interaction, and sends the information back to Teams compose box.

## Action command invocation locations

There are three different areas action commands can be invoked from:

1. Compose Area
2. Compose Box
3. Message

### Compose Area and Box

![compose area and box](../../assets/screenshots/compose-area.png)

### Message action command

![message action command](../../assets/screenshots/message.png)

> [!tip]
> See the [Invoke Locations](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/action-commands/define-action-command?tabs=Teams-toolkit%2Cdotnet#select-action-command-invoke-locations) guide to learn more about the different entry points for action commands.

## Setting up your Teams app manifest

To use action commands you have define them in the Teams app manifest. Here is an example:

<!-- langtabs-start -->
```json
"composeExtensions": [
    {
        "botId": "${{BOT_ID}}",
        "commands": [
            {
            "id": "createCard",
            "type": "action",
            "context": [
                "compose",
                "commandBox"
            ],
            "description": "Command to run action to create a card from the compose box.",
            "title": "Create Card",
            "parameters": [
                {
                    "name": "title",
                    "title": "Card title",
                    "description": "Title for the card",
                    "inputType": "text"
                },
                {
                    "name": "subTitle",
                    "title": "Subtitle",
                    "description": "Subtitle for the card",
                    "inputType": "text"
                },
                {
                    "name": "text",
                    "title": "Text",
                    "description": "Text for the card",
                    "inputType": "textarea"
                }
            ]
            },
            {
                "id": "getMessageDetails",
                "type": "action",
                "context": [
                    "message"
                ],
                "description": "Command to run action on message context.",
                "title": "Get Message Details"
            },
            {
                "id": "fetchConversationMembers",
                "description": "Fetch the conversation members",
                "title": "Fetch Conversation Members",
                "type": "action",
                "fetchTask": true,
                "context": [
                    "compose"
                ]
            },
        ]
    }
]
```
<!-- langtabs-end -->

Here we are defining three different commands:

1. `createCard` - that can be invoked from either the `compose` or `commandBox` areas. Upon invocation a dialog will popup asking the user to fill the `title`, `subTitle`, and `text`.

![Parameters](../../assets/screenshots/parameters.png)

2. `getMessageDetails` - It is invoked from the `message` overflow menu. Upon invocation the message payload will be sent to the app which will then return the details like `createdDate`...etc.

![Get Message Details Command](../../assets/screenshots/message-command.png)

3. `fetchConversationMembers` - It is invoked from the `compose` area. Upon invocation the app will return an adaptive card in the form of a dialog with the conversation roster.

![Fetch conversation members](../../assets/screenshots/fetch-conversation-members.png)

## Handle submission

Handle submission when the `createCard` or `getMessageDetails` actions commands are invoked.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.message-ext-submit.ts }}
```
<!-- langtabs-end -->

`createCard()` function

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/card.snippet.message-ext-create-card.ts }}
```
<!-- langtabs-end -->

`createMessageDetailsCard()` function

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/card.snippet.message-ext-create-message-details-card.ts }}
```
<!-- langtabs-end -->

## Handle opening adaptive card dialog

Handle opening adaptive card dialog when the `fetchConversationMembers` command is invoked.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.message-ext-open.ts }}
```
<!-- langtabs-end -->

`createConversationMembersCard()` function

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/card.snippet.message-ext-create-conversation-members-card.ts }}
```
<!-- langtabs-end -->

## Resources

- [Action commands](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/action-commands/define-action-command?tabs=Teams-toolkit%2Cdotnet)
