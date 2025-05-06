# Activity: Read Receipt Event

A read receipt event is sent when a user has read a message, and in the UI shows as an eye icon next to the message.

<!-- langtabs-start -->
```typescript
app.on('readReceipt', async ({ activity }) => {});
```
<!-- langtabs-end -->

`'readReceipt'` is alias for the event name `'application/vnd.microsoft.readReceipt'`.

## Read receipts

Bots can also subscribe to read receipts to track when a message has been read by a user. For example, if a read receipt is not received by the bot, the bot could send a follow-up message in personal chat.

Please note that in Teams, the RSC `ChatMessageReadReceipt.Read.Chat` permissions must be added to the app manifest to receive read receipts.

## Resources

- [Microsoft Teams: Read Receipts](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/build-conversational-capability#receive-a-read-receipt)
