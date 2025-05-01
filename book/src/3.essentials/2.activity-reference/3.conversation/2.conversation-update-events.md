# Activity: Conversation Update Events

As seen from the previous page, the `conversationUpdate` activity is used to describe a change in a conversation's members, description, existence, or otherwise. There are several default events that originate from the Agents protocol. However, Teams also has custom events that can be used to extend the conversation update activity.

## Default conversation update events

The following events are part of the original Agents protocol and are supported by Teams.

```typescript
// Initiate an action when a team member is added to a conversation
app.on('conversationUpdate', async ({ activity }) => {
  if (activity.membersAdded) {
  }
});
```

- `historyDisclosed` - Deprecated
- `membersAdded`
- `membersRemoved`
- `topicName`

## Custom Teams conversation update events

The following events are custom to Teams and are not part of the original Agents protocol. These events are handled by the router and can be referenced directly as below.

```typescript
app.on('channelCreated', async ({ activity }) => {});
```

The following events are custom to Teams and are not part of the original Agents protocol.

- `channelCreated`
- `channelDeleted`
- `channelRenamed`
- `channelRestored`
- `teamArchived`
- `teamDeleted`
- `teamHardDeleted`
- `teamRenamed`
- `teamRestored`
- `teamUnarchived`

## Table of conversation update events

| Event                | Action taken                                       | Scope                 |
| -------------------- | -------------------------------------------------- | --------------------- |
| `'channelCreated'`   | Channel created                                    | Team                  |
| `'channelDeleted'`   | Channel deleted                                    | Team                  |
| `'channelRenamed'`   | Channel renamed                                    | Team                  |
| `'channelRestored'`  | Channel restored                                   | Team                  |
| `'historyDisclosed'` | _Deprecated._ Whether channel history is disclosed | Team                  |
| `'membersAdded'`     | List of members added                              | Personal, Group, Team |
| `'membersRemoved'`   | List of members removed                            | Personal, Group, Team |
| `'teamRenamed'`      | Team is renamed                                    | Team                  |
| `'teamDeleted'`      | Team is deleted                                    | Team                  |
| `'teamHardDeleted'`  | Team is permanently deleted                        | Team                  |
| `'teamArchived'`     | Team is archived                                   | Team                  |
| `'teamUnarchived'`   | Team is unarchived                                 | Team                  |
| `'teamRestored'`     | Team is restored after being deleted               | Team                  |
| `'topicName'`        | Chat's display name for a group chat               | Group                 |
