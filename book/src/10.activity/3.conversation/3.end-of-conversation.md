# Activity: End Of Conversation

End of conversation activities signal the end of a conversation from the recipient's perspective. This may be because the conversation has been completely ended, or because the recipient has been removed from the conversation in a way that is indistinguishable from it ending. The conversation being ended is described in the `conversation` field.

> [**ℹ️ Note**]
> This event is not applicable to Teams.

```typescript
app.on('endOfConversation', async ({ activity }) => {});
```

## Schema

End of conversation activities are identified by a `type` value of `endOfConversation`.

Both the `code` and the `text` fields are optional.

### Code

The `code` field contains a programmatic value describing why or how the conversation was ended. The value of the `code` field is of type string and its meaning is defined by the channel sending the activity.

### Text

The `text` field contains optional text content to be communicated to a user. The value of the `text` field is of type string, and its format is plain text.
