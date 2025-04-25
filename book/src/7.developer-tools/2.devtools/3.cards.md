# 🪪 Cards

![Card Designer Typescript](https://github.com/microsoft/teams.ts/blob/main/assets/screenshots/card_designer_typescript_editor.png?raw=true)

Use the Cards page to design and test your cards. Then, use the "Attach card" button to add that card as an attachment to your message. By default, the card will be attached in the new message compose box, but you can also attach a card when editing an existing message.

## Using the card designer from Chat

Add an attachment to your message by clicking the attachment (paperclip) icon in the compose box. Select "Open card designer" from the dropdown menu, and your card will be added as an attachment to the same message you are composing or editing after you click "Attach card".

> [!TIP]
> DevTools stores your card attachment so you can use it between page navigation (Chat to Cards and back). Only the last card you designed will be stored, and only temporarily, so if you want to save a card, make sure to save the payload to a file or copy it to your clipboard.
> Also check out the **[Adaptive Cards Designer](https://adaptivecards.microsoft.com/designer)** and [documentation](https://adaptivecards.microsoft.com/designer).

## Pasting Adaptive Card JSON

You can also use the "Paste custom JSON" menu option to paste an Adaptive Card JSON payload into the dialog that will renders. This adds the attachment to the message you are composing or editing.

Please keep an eye out for a big update coming soon!
