# Activity: Conversation Update

Conversation update activities describe a change in a conversation's members, description, existence, or otherwise. Conversation update activities generally do not contain user-generated content. The conversation being updated is described in the `conversation` field.

```typescript
app.on('conversationUpdate', async ({ activity }) => {});
```

## Schema

Conversation update activities are identified by a `type` value of `conversationUpdate`.

`A4100`: Senders MAY include zero or more of `membersAdded`, `membersRemoved`, `topicName`, and `historyDisclosed` fields in a conversation update activity.

`A4101`: Each `channelAccount` (identified by `id` field) SHOULD appear at most once within the `membersAdded` and `membersRemoved` fields. An ID SHOULD NOT appear in both fields. An ID SHOULD NOT be duplicated within either field.

`A4102`: Channels SHOULD NOT use conversation update activities to indicate changes to a channel account's fields (e.g., `name`) if the channel account was not added to or removed from the conversation.

`A4103`: Channels SHOULD NOT send the `topicName` or `historyDisclosed` fields if the activity is not signaling a change in value for either field.

### Members added

The `membersAdded` field contains a list of channel participants (bots or users) added to the conversation. The value of the `membersAdded` field is an array of type [`channelAccount`](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#channel-account).

### Members removed

The `membersRemoved` field contains a list of channel participants (bots or users) removed from the conversation. The value of the `membersRemoved` field is an array of type [`channelAccount`](#https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#channel-account).

### Topic name

The `topicName` field contains the text topic or description for the conversation. The value of the `topicName` field is of type string.

### History disclosed

The `historyDisclosed` field is deprecated.

`A4110`: Senders SHOULD NOT include the `historyDisclosed` field.
