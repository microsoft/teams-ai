# Activity: Command

Command activities communicate a request to perform a specific action.

Commands look similar in structure to events but have different semantics. Commands are requests to perform an action and receivers typically respond with one or more commandResult activities. Receivers are also expected to explicitly reject unsupported command activities.

> [**ℹ️ Note**]
> This event type is not applicable to Teams.

```typescript
app.on('command', async ({ activity }) => {});
```

## Schema

Command activities are identified by a `type` value of `command` and specific values of the `name` field.

`A6300`: Channels MAY allow application-defined command activities between clients and bots, if the clients allow application customization.

`A6301`: Application-defined command activities MUST be declared in the `application/*` namespace.

`A6302`: Command activities outside the `application/*` are considered reserved for Activity Protocol.

The list of Activity Protocol command activities is included in [Appendix VI](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#appendix-vi---protocols-using-the-command-activity).

### Name

The `name` field defines the meaning of the command activity. The value of the `name` field is of type string.

`A6310`: Command activities MUST contain a `name` field.

`A6311`: The `name` of a command activity MUST use a [MIME media type](https://www.iana.org/assignments/media-types/media-types.xhtml) [[8](#references)] format.

`A6312`: Receivers MUST ignore command activities with missing or invalid `name` field.

The recommended patterns for rejecting command activities are included in [Appendix VI](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#appendix-vi---protocols-using-the-command-activity).

### Value

The `value` field contains the command metadata and parameters specific to a command, as defined by the command `name`. The `value` field is a complex object of the [command value](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#command-value) type.

`A6321`: Command activities MUST contain a `value` field.

`A6322`: Receivers MUST ignore command activities with missing or invalid `value` field.
