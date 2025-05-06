# Message Reaction

Message reaction activities represent a social interaction on an existing message activity within a conversation. The original activity is referred to by the `id` and `conversation` fields within the activity. The `from` field represents the source of the reaction (i.e., the user that reacted to the message).

<!-- langtabs-start -->
```typescript
app.on('messageReaction', async ({ activity }) => {});
```
<!-- langtabs-end -->

## Schema

Message reaction activities are identified by a `type` value of `messageReaction`.

### Reactions added

The `reactionsAdded` field contains a list of reactions added to this activity. The value of the `reactionsAdded` field is an array of type [`messageReaction`](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#message-reaction-activity).

### Reactions removed

The `reactionsRemoved` field contains a list of reactions removed from this activity. The value of the `reactionsRemoved` field is an array of type `messageReaction`.

## Message reaction usage in Teams

Message reactions can be used to express a variety of social interactions on messages sent in Teams chat. By hovering over a message, you can see the available reactions for that message.

![Message reactions UI in Teams](../../assets/screenshots/message-reaction-ui.png)

To react to a message, click the reaction you want to use. This will add the reaction to the message.

![Adding a reaction to a message in Teams](../../assets/screenshots/message-reaction-add.png)
