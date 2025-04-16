# Activity: Trace

The Trace activity is an activity which the developer inserts in to the stream of activities to represent a point in the developers bot logic. The trace activity typically is logged by transcript history components to become part of a [Transcript-format](../transcript/transcript.md) history file. In remote debugging scenarios the Trace activity can be sent to the client so that the activity can be inspected as part of the debug flow.

Trace activities are normally not shown to the user, and are internal to transcript logging and developer debugging.

```typescript
app.on('trace', async ({ activity }) => {});
```

## Schema

Trace activities are identified by a `type` value of `trace`.

`A6150`: channels SHOULD NOT display trace activities to the user, unless the user has identified itself as the developer in a secure manner.

### Name

The `name` field controls the name of the trace operation. The value of the `name` field is of type string.

`A6151`: Trace activities MAY contain a `name` field.

`A6152`: Receivers MUST ignore event activities with `name` fields they do not understand.

### Label

The `label` field contains optional a label which can provide contextual information about the trace. The value of the `label` field is of type string.

`A6153`: Trace activities MAY contain a `label` field.

### ValueType

The `valueType` field is a string type which contains a unique value which identifies the shape of the `value` object for this trace.

`A6154`: The `valueType` field MAY be missing or empty, if the `name` property is sufficient to understand the shape of the `value` property.

### Value

The `value` field contains an object for this trace, as defined by the `valueType` or `name` property if there is no `valueType`. The value of the `value` field is a complex type.

`A6155`: The `value` field MAY be missing or empty.

`A6156`: Extensions to the trace activity SHOULD NOT require receivers to use any information other than the activity `type` and `name` or `valueType` field to understand the schema of the `value` field.

### Relates to

The `relatesTo` field references another conversation, and optionally a specific activity within that conversation. The value of the `relatesTo` field is a complex object of the [Conversation reference](#conversation-reference) type.

`A6157`: `relatesTo` MAY reference an activity within the conversation identified by the `conversation` field.
