# Activity: Message

Message activities represent content intended to be shown within a conversational interface. Message activities may contain text, speech, interactive cards, and binary or unknown attachments; typically channels require at most one of these for the message activity to be well-formed.

<!-- langtabs-start -->
```typescript
app.on('message', async ({ activity }) => {});
```
<!-- langtabs-end -->

## Schema

Message activities are identified by a `type` value of `message`.

### Text

The `text` field contains text content, either in the Markdown format, XML, or as plain text. The format is controlled by the [`textFormat`](#text-Format) field as is plain if unspecified or ambiguous. The value of the `text` field is of type string.

`A3000`: The `text` field MAY contain an empty string to indicate sending text without contents.

`A3001`: Channels SHOULD handle `markdown`-formatted text in a way that degrades gracefully for that channel.

### Text format

The `textFormat` field denotes whether the [`text`](#text) field should be interpreted as [Markdown](https://daringfireball.net/projects/markdown/) [[3](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#references)], plain text, or XML. The value of the `textFormat` field is of type string, with defined values of `markdown`, `plain`, and `xml`. The default value is `plain`. This field is not designed to be extended with arbitrary values.

The `textFormat` field controls additional fields within attachments etc. This relationship is described within those fields, elsewhere in this document.

`A3010`: If a sender includes the `textFormat` field, it SHOULD only send defined values.

`A3011`: Senders SHOULD omit `textFormat` if the value is `plain`.

`A3012`: Receivers SHOULD interpret undefined values as `plain`.

`A3013`: Bots and clients SHOULD NOT send the value `xml` unless they have prior knowledge that the channel supports it, and the characteristics of the supported XML dialect.

`A3014`: Channels SHOULD NOT send `markdown` or `xml` contents to bots.

`A3015`: Channels SHOULD accept `textformat` values of at least `plain` and `markdown`.

`A3016`: Channels MAY reject `textformat` of value `xml`.

### Locale

The `locale` field communicates the language code of the [`text`](#text) field. The value of the `locale` field is an [IETF BCP-47](https://tools.ietf.org/html/bcp47) [[18](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#references)] language tag within a string.

`A3020`: Receivers SHOULD treat missing and unknown values of the `locale` field as unknown.

`A3021`: Receivers SHOULD NOT reject activities with unknown locale.

### Speak

The `speak` field indicates how the activity should be spoken via a text-to-speech system. The field is only used to customize speech rendering when the default is deemed inadequate. It replaces speech synthesis for any content within the activity, including text, attachments, and summaries. The value of the `speak` field is either plain text or [SSML](https://www.w3.org/TR/speech-synthesis/) [[6](#references)] encoded within a string.

`A3030`: The `speak` field MAY contain an empty string to indicate no speech should be generated.

`A3031`: Receivers unable to generate speech SHOULD ignore the `speak` field.

`A3033`: Receivers SHOULD NOT use XML DTD or schema resolution to include remote resources from outside the communicated XML fragment.

`A3034`: Channels SHOULD NOT send the `speak` field to bots.

`A3035`: Receivers generating speech from an Activity with a missing or null `speak` field SHOULD render message contents such as [`text`](#text) and [`summary`](#summary) instead.

### Input hint

The `inputHint` field indicates whether or not the generator of the activity is anticipating a response. This field is used predominantly within channels that have modal user interfaces, and is typically not used in channels with continuous chat feeds. The value of the `inputHint` field is of type string, with defined values of `accepting`, `expecting`, and `ignoring`. The default value is `accepting`.

`A3040`: If a sender includes the `inputHint` field, it SHOULD only send defined values.

`A3041`: If sending an activity to a channel where `inputHint` is used, bots SHOULD include the field, even when the value is `accepting`.

`A3042`: Receivers SHOULD interpret undefined values as `accepting`.

### Attachments

The `attachments` field contains a flat list of objects to be displayed as part of this activity. The value of each `attachments` list element is a complex object of the [Attachment](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#attachment) type.

`A3050`: Senders SHOULD omit the `attachments` field if it contains no elements.

`A3051`: Senders MAY send multiple entities of the same type.

`A3052`: Receivers MAY treat attachments of unknown types as downloadable documents.

`A3053`: Receivers SHOULD preserve the ordering of attachments when processing content, except when rendering limitations force changes, e.g. grouping of documents after images.

### Attachment layout

The `attachmentLayout` field instructs user interface renderers how to present content included in the [`attachments`](#attachments) field. The value of the `attachmentLayout` field is of type string, with defined values of `list` and `carousel`. The default value is `list`.

`A3060`: If a sender includes the `attachmentLayout` field, it SHOULD only send defined values.

`A3061`: Receivers SHOULD interpret undefined values as `list`.

### Summary

The `summary` field contains text used to replace [`attachments`](#attachments) on channels that do not support them. The value of the `summary` field is of type string.

`A3070`: Receivers SHOULD consider the `summary` field to logically follow the `text` field.

`A3071`: Channels SHOULD NOT send the `summary` field to bots.

`A3072`: Channels able to process all attachments within an activity SHOULD ignore the `summary` field.

### Suggested actions

The `suggestedActions` field contains a payload of interactive actions that may be displayed to the user. Support for `suggestedActions` and their manifestation depends heavily on the channel. The value of the `suggestedActions` field is a complex object of the [Suggested actions](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#suggested-actions-2) type.

### Value

The `value` field contains a programmatic payload specific to the activity being sent. Its meaning and format are defined in other sections of this document that describe its use.

`A3080`: Senders SHOULD NOT include `value` fields of primitive types (e.g. string, int). `value` fields SHOULD be complex types or omitted.

### Expiration

The `expiration` field contains a time at which the activity should be considered to be "expired" and should not be presented to the recipient. The value of the `expiration` field is an [ISO 8601 date time format](https://www.iso.org/iso-8601-date-and-time-format.html)[[2](#references)] encoded datetime within a string.

`A3090`: Senders SHOULD always use encode the value of `expiration` fields as UTC, and they SHOULD always include Z as an explicit UTC mark within the value.

### Importance

The `importance` field contains an enumerated set of values to signal to the recipient the relative importance of the activity. It is up to the receiver to map these importance hints to the user experience. The value of the `importance` field is of type string, with defined values of `low`, `normal` and `high`. The default value is `normal`.

`A3100`: If a sender includes the `importance` field, it SHOULD only send defined values.

`A3101`: Receivers SHOULD interpret undefined values as `normal`.

### Delivery mode

The `deliveryMode` field contains any one of an enumerated set of values to signal to the recipient alternate delivery paths for the activity or response. The value of the `deliveryMode` field is of type string, with defined values of `normal`, `notification` and `expectReplies`. The default value is `normal`.

Activities with a `deliveryMode` of `expectReplies` differ only in their requirement to return a response payload back to the caller synchronously, as a direct response to the initial request.

`A3110`: If a sender includes the `deliveryMode` field, it SHOULD only send defined values.

`A3111`: Receivers SHOULD interpret undefined values as `normal`.

`A3112`: Receivers SHOULD reject activities with `deliveryMode` of `expectReplies` if they do not support synchronous responses.

`A3113`: Receivers SHOULD NOT reply with asynchronous responses to activities with `deliveryMode` of `expectReplies`.

`A3114`: Senders MUST NOT include `deliveryMode` of `expectReplies` on Invoke activities unless the Invoke profile explicitly allows and describes its behavior.

`A3115`: Senders MUST establish whether a receiver understands `deliveryMode` of `expectReplies` prior to sending activities with that value.

`A3116`: Bots SHOULD NOT send activities with `deliveryMode` of `expectReplies` to channels.

### Listen for

The `listenFor` field contains a list of terms or references to term sources that speech and language processing systems can listen for. It can also be referred to as [priming format](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#appendix-iv---priming-format). The value of the `listenFor` field is an array of strings whose format allows:

1. Phrases, including single-term phrases (e.g. "house", "open the doors")
2. Sources of phrases (e.g. from an LLM)

A missing `listenFor` field indicates default priming behavior should be used. The default is defined by the channel and may depend on variables such as the identity of the user and the bot.

`A3120`: Channels SHOULD NOT populate the `listenFor` field.

`A3121`: Bots SHOULD send `listenFor` contents that reflect the complete set of utterances expected from users, not just the utterances in response to the content in the message in which the `listenFor` is included.

### Semantic action

The `semanticAction` field contains an optional programmatic action accompanying the user request. The semantic action field is populated by the channel and bot based on some understanding of what the user is trying to accomplish; this understanding may be achieved with natural language processing, additional user interface elements tied specifically to these actions, through a process of conversational refinement, or contextually via other means. The meaning and structure of the semantic action is agreed ahead of time between the channel and the bot.

The value of the `semanticAction` field is a complex object of the [semantic action](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#semantic-action-type) type.

`A3130`: Channels and bots MAY populate the `semanticAction` field. Other senders SHOULD NOT populate the `semanticAction` field.

Information within the semantic action field is meant to augment, not replace, existing content within the activity. A well-formed semantic action has a defined name, corresponding well-formed entities, and matches the user's intent in generating the activity.

`A3131`: Senders SHOULD NOT remove any content used to generate the `semanticAction` field.

`A3132`: Receivers MAY ignore parts or all of the `semanticAction` field.

`A3133`: Receivers MUST ignore `semanticAction` fields they cannot parse or do not understand.

Semantic actions are sometimes used to indicate a change in which participant controls the conversation. For example, a channel may use actions during an exchange with a skill. When so defined, skills can relinquish control through the [handoff activity](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#handoff-activity) after the final `semanticAction` `state` is `done`.

`A3135`: Channels MAY define the use of handoff activity in conjunction with semantic actions.

`A3136`: Bots MAY use semantic action and handoff activity internally to coordinate conversational focus between components of the bot.

## Resources

- [Agents Activity Protocol Schema](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md)
- [Microsoft Learn: Message](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bot-conversations/bots-conversations#conversation-basics)
