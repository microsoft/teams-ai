# 📖 [🪪 Cards](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/design-effective-cards)

An Adaptive Card contains a freeform body of card elements and optional set of actions. Adaptive Cards are actionable snippets of content that you can add to a conversation through a bot or message extension. Using text, graphics, and buttons, these cards provide rich communication to your audience.

The Adaptive Card framework is used across many Microsoft products, including Teams. You can send cards inside messages to users via bots or message extensions. Users can also take actions on cards when present.

## Typescript/Javascript

```typescript
import {
  Card,
  ColumnSet,
  Column,
  Image,
  CodeBlock,
} from "@microsoft/teams.cards";

Card([
  ColumnSet([
    Column([Image("...")]),
    Column([CodeBlock({ codeSnippet: "..." })]),
  ]),
]);
```

## Json

```json
{
  "$schema": "http://https://adaptivecards.microsoft.com//schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.6",
  "body": [
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "items": [
            {
              "type": "Image",
              "url": "..."
            }
          ]
        },
        {
          "type": "Column",
          "items": [
            {
              "type": "CodeBlock",
              "codeSnippet": "..."
            }
          ]
        }
      ]
    }
  ]
}
```

[https://adaptivecards.microsoft.com/](https://https://adaptivecards.microsoft.com//)

## Resources

- [Microsoft Learn: Adaptive Cards Actions](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/cards-actions?tabs=json#adaptive-cards-actions)
