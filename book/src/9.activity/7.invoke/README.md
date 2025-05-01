# Activity: Invoke

Invoke activities communicate programmatic information from a client or channel to a bot, and have a corresponding return payload for use within the channel. The meaning of an invoke activity is defined by the `name` field, which is meaningful within the scope of a channel.

Invoke activities are the synchronous counterpart to [event activities](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#event-activity). Event activities are designed to be extensible. Invoke activities differ only in their ability to return response payloads back to the channel; because the channel must decide where and how to process these response payloads, Invoke is useful only in cases where explicit support for each invoke name has been added to the channel. Thus, Invoke is not designed to be a generic application extensibility mechanism.

```typescript
app.on('invoke', async ({ activity }) => {});
```

## Schema

Invoke activities are identified by a `type` value of `invoke` and specific values of the `name` field.

The list of defined Invoke activities is included in [Appendix III](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#appendix-iii---protocols-using-the-invoke-activity).

`A5301`: Channels SHOULD NOT allow application-defined invoke messages between clients and bots.

### Name

The `name` field controls the meaning of the invocation and the schema of the `value` field. The value of the `name` field is of type string.

`A5401`: Invoke activities MUST contain a `name` field.

`A5402`: Receivers MUST ignore event activities with `name` fields they do not understand.

### Value

The `value` field contains parameters specific to this event, as defined by the event name. The value of the `value` field is a complex type.

`A5500`: The `value` field MAY be missing or empty, if defined by the event name.

`A5501`: Extensions to the event activity SHOULD NOT require receivers to use any information other than the activity `type` and `name` fields to understand the schema of the `value` field.

### Relates to

The `relatesTo` field references another conversation, and optionally a specific activity within that conversation. The value of the `relatesTo` field is a complex object of the [Conversation reference](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#conversation-reference) type.

`A5600`: `relatesTo` SHOULD NOT reference an activity within the conversation identified by the `conversation` field.

## App permissions

In Teams, the app manifest requires specific setup to have invoke permissions. These permissions are dependent on the type of invoke(s) being used in your application.

## Invoke Aliases

The `@microsoft/teams.api` package includes a set of aliases for the `name` field of invoke activities. These aliases are used to simplify the syntax of invoking activities in your application.

Please see the subsequent sections for more information on the aliases that are available.

## Resources

- [Microsoft Learn: Graph API - Resource specific consent](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
