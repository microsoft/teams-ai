# Activity: Command Result

Command result activities communicate the result of a [command activity](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#command-activity).

> [**ℹ️ Note**]
> This event type is not applicable to Teams.

```typescript
app.on('commandResult', async ({ activity }) => {});
```

## Schema

Command result activities are identified by a `type` value of `commandResult` and specific values of the `name` field. The `name` field of a command result is always set to the `name` of the original command activity.

`A6400`: Senders MAY send one or more command result activities to communicate the result of the command.

### Name

The `name` field defines the meaning of the command result activity. The value of the `name` field is of type string.

`A6411`: Command result activities MUST contain a `name` field.

`A6412`: Receivers MUST ignore command activities with missing or invalid `name` field.

`A6413`: The `name` of a command result activity MUST be the same as the `name` of the original command activity.

### Value

The `value` field contains the command metadata and additional information specific to a command result, as defined by the command result `name`. The value of the `value` field is a complex object of type [command result value](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#command-result-value) type.

`A6421`: Command result activities MUST contain a `value` field.

`A6422`: Receivers MUST reject command result activities with missing or invalid `value` field.
