# Link unfurling

Link unfurling lets your app respond when users paste URLs into Teams. When a URL from your registered domain is pasted, your app receives the URL and can return a card with additional information or actions. This works like a search command where the URL acts as the search term. Users can use link unfurling without installing your app.

## Setting up your Teams app manifest

<!-- langtabs-start -->
```json
"composeExtensions": [
    {
        "botId": "${{BOT_ID}}",
        "messageHandlers": [
            {
                "type": "link",
                "value": {
                    "domains": [
                        "www.test.com"
                    ]
                }
            }
        ]
    }
]
```
<!-- langtabs-end -->

When a user pastes a URL from your registered domain (like `www.test.com`) into the Teams compose box, your app will receive a notification. Your app can then respond by returning an adaptive card that displays a preview of the linked content. This preview card appears before the user sends their message in the compose box, allowing them to see how the link will be displayed to others.

```mermaid
flowchart TD
    A1["User pastes a URL (e.g., www\.test\.com) in Teams compose box"]
    B1([Microsoft Teams])
    C1["Your App"]
    D1["Adaptive Card Preview"]

    A1 --> B1
    B1 -->|Sends URL paste notification| C1
    C1 -->|Returns card and preview| B1
    B1 --> D1

    %% Styling for readability and compatibility
    style B1 fill:#2E86AB,stroke:#1B4F72,stroke-width:2px,color:#ffffff
    style C1 fill:#28B463,stroke:#1D8348,stroke-width:2px,color:#ffffff
    style D1 fill:#F39C12,stroke:#D68910,stroke-width:2px,color:#ffffff
```

## Handle link unfurling

Handle link unfurling when a URL from your registered domain is submited into the Teams compose box.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.message-ext-query-link.ts }}
```
<!-- langtabs-end -->

`createLinkUnfurlCard()` function

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/card.snippet.message-ext-create-link-unfurl-card.ts }}
```
<!-- langtabs-end -->

The link unfurling response includes both a full adaptive card and a preview card. The preview card appears in the compose box when a user pastes a URL:

![Link unfurl preview card](../../assets/screenshots/link-unfurl-preview.png)

The user can expand the preview card by clicking on the _expand_ button on the top right.

![Link unfurl card in conversation](../../assets/screenshots/link-unfurl-card.png)

The user can then choose to send entire the preview or the full adaptive card as a message.

## Resources

- [Link unfurling](https://learn.microsoft.com/en-us/microsoftteams/platform/messaging-extensions/how-to/link-unfurling?tabs=desktop%2Cjson%2Cadvantages)
