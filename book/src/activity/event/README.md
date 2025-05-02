# Activity: Event

Event activities communicate programmatic information from a client or channel to a bot. The meaning of an event activity is defined by the `name` field, which is meaningful within the scope of a channel. Event activities are designed to carry both interactive information (such as button clicks) and non-interactive information (such as a notification of a client automatically updating an embedded speech model).

Event activities are the asynchronous counterpart to [invoke activities](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#invoke-activity). (See [Invoke Activity](../invoke) for more information on invokes.) Unlike invoke, event is designed to be extended by client application extensions.

```typescript
app.on('event', async ({ activity }) => {});
```

## Schema

Event activities are identified by a `type` value of `event` and specific values of the `name` field.

`A5000`: Channels MAY allow application-defined event messages between clients and bots, if the clients allow application customization.

### Name

The `name` field controls the meaning of the event and the schema of the `value` field. The value of the `name` field is of type string.

`A5001`: Event activities MUST contain a `name` field.

`A5002`: Receivers MUST ignore event activities with `name` fields they do not understand.

### Value

The `value` field contains parameters specific to this event, as defined by the event name. The value of the `value` field is a complex type.

`A5100`: The `value` field MAY be missing or empty, if defined by the event name.

`A5101`: Extensions to the event activity SHOULD NOT require receivers to use any information other than the activity `type` and `name` fields to understand the schema of the `value` field.

### Relates to

The `relatesTo` field references another conversation, and optionally a specific activity within that conversation. The value of the `relatesTo` field is a complex object of the [Conversation reference](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#conversation-reference) type.

`A5200`: `relatesTo` SHOULD NOT reference an activity within the conversation identified by the `conversation` field.
