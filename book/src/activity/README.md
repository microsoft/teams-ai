# Activity

<!--  The Activity protocol is defined by the [Agents SDK Activity Protocol](https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md#introduction). -->

An activity is an application-level representation of conversational actions made by humans and automated software.

<!-- langtabs-start -->
```typescript
app.on('activity', async ({ activity }) => {});
```
<!-- langtabs-end -->

## Schema

Activity objects include a flat list of name/value pairs, called fields. Fields may be primitive and complex types. JSON is used as the common interchange format and although not all activities must be serialized to JSON at all times, they must be serializable to it. This allows implementations to rely on a simple set of conventions for handling known and unknown activity fields.

`A2001`: Activities MUST be serializable to the JSON format defined in [RFC 4627](http://www.ietf.org/rfc/rfc4627.txt) [[14](#references)], including adherence to e.g. field uniqueness constraints.

`A2002`: Receivers MAY allow improperly-cased field names, although this is not required. Receivers MAY reject activities that do not include fields with the proper casing.

`A2004`: Unless otherwise noted, senders SHOULD NOT include empty string values for string fields.

`A2005`: Unless otherwise noted, senders MAY include additional fields within the activity or any nested complex objects. Receivers MUST accept fields they do not understand.

`A2006`: Receivers SHOULD accept events of types they do not understand.

This document defines data types for fields used within the Activity object. These type definitions include a syntactic type (e.g. `string` or `complex type`) and in the case of strings, an optional format (e.g. [ISO 8601 date time format](https://www.iso.org/iso-8601-date-and-time-format.html) [[2](#references)]).

`A2007`: Senders MUST adhere to data type definitions contained in this document.

`A2003`: Receivers SHOULD reject activities that contain field values whose types do not match the data types described in this specification.

### Type

The `type` field controls the meaning of each activity, and are by convention short strings (e.g. "`message`"). Senders may define their own application-layer types, although they are encouraged to choose values that are unlikely to collide with future well-defined values. If senders use URIs as type values, they SHOULD NOT implement URI ladder comparisons to establish equivalence.

`A2010`: Activities MUST include a `type` field, with string value type.

`A2011`: Two `type` values are equivalent only if they are ordinally identical.

`A2012`: A sender MAY generate activity `type` values not defined in this document.

`A2013`: A channel SHOULD reject activities of type it does not understand.

`A2014`: A bot or client SHOULD ignore activities of type it does not understand.

### Channel ID

The `channelId` field establishes the channel and authoritative store for the activity. The value of the `channelId` field is of type string.

> For Teams, the `channelId` is `'msteams'`.

`A2020`: Channel Activities MUST include a `channelId` field, with string value type.

`A2021`: Two `channelId` values are equivalent only if they are ordinally identical.

`A2022`: A channel MAY ignore or reject any activity it receives without an expected `channelId` value.

### ID

The `id` field establishes the identity for the activity once it has been recorded in the channel. Activities in-flight that have not yet been recorded do not have identities. Not all activities are assigned identities (for example, a [typing activity](#typing-activity) may never be assigned an `id`.) The value of the `id` field is of type string.

`A2030`: Channels SHOULD include an `id` field if it is available for that activity.

`A2031`: Clients and bots SHOULD NOT include an `id` field in activities they generate.

For ease of implementation, it should be assumed that other participants do not have sophisticated knowledge of activity IDs, and that they will use only ordinal comparison to establish equivalency.

For example, a channel may use hex-encoded GUIDs for each activity ID. Even though GUIDs encoded in uppercase are logically equivalent to GUIDs encoded in lowercase, senders SHOULD NOT use these alternative encodings when possible. The normalized version of each ID is established by the authoritative store, the channel.

`A2032`: When generating `id` values, senders SHOULD choose values whose equivalency can be established by ordinal comparison. However, senders and receivers MAY allow logical equivalence of two values that are not ordinally equivalent if they have special knowledge of the circumstances.

The `id` field is designed to allow de-duplication, but this is prohibitive in most applications.

`A2033`: Receivers MAY de-duplicate activities by ID, however senders SHOULD NOT rely on receivers performing this de-duplication.

### Timestamp

The `timestamp` field records the exact UTC time when the activity occurred. Due to the distributed nature of computing systems, the important time is when the channel (the authoritative store) records the activity. The time when a client or bot initiated an activity may be transmitted separately in the `localTimestamp` field. The value of the `timestamp` field is an [ISO 8601 date time format](https://www.iso.org/iso-8601-date-and-time-format.html) [[2](#references)] encoded datetime within a string.

`A2040`: Channels SHOULD include a `timestamp` field if it is available for that activity.

`A2041`: Clients and bots SHOULD NOT include a `timestamp` field in activities they generate.

`A2042`: Clients and bots SHOULD NOT use `timestamp` to reject activities, as they may appear out-of-order. However, they MAY use `timestamp` to order activities within a UI or for downstream processing.

`A2043`: Senders SHOULD always use encode the value of `timestamp` fields as UTC, and they SHOULD always include Z as an explicit UTC mark within the value.

### Local timezone

The `localTimezone` field expresses the timezone where the activity was generated. The value of the `localTimezone` field is a time zone name (zone entry) per the IANA Time Zone database. [[14](#references)]

`A2055`: Clients MAY include the `localTimezone` in their activities.

`A2056`: Channels SHOULD preserve `localTimezone` when forwarding activities from a sender to recipient(s).

`A2057`: A receiver MAY ignore `localTimezone` values it does not understand.

### Local timestamp

The `localTimestamp` field expresses the datetime and timezone offset where the activity was generated. This may be different from the UTC `timestamp` where the activity was recorded. The value of the `localTimestamp` field is an ISO 8601 [[2](#references)] encoded datetime within a string.

When both the `localTimezone` and `localTimestamp` fields are included in an activity, the interpretation is to first convert the value of the localTimestamp to UTC and then apply a conversion to the local timezone.

`A2050`: Clients and bots MAY include the `localTimestamp` field in their activities. They SHOULD explicitly list the timezone offset within the encoded value.

`A2051`: Channels SHOULD preserve `localTimestamp` when forwarding activities from a sender to recipient(s).

### From

The `from` field describes which client, bot, or channel generated an activity. The value of the `from` field is a complex object of the [Channel account](#channel-account) type.

The `from.id` field identifies who generated an activity. Most commonly, this is another user or bot within the system. In some cases, the `from` field identifies the channel itself.

`A2060`: Channels MUST include the `from` and `from.id` fields when generating an activity.

`A2061`: Bots and clients SHOULD include the `from` and `from.id` fields when generating an activity. A channel MAY reject an activity due to missing `from` and `from.id` fields.

The `from.name` field is optional and represents the display name for the account within the channel. Channels SHOULD include this value so clients and bots can populate their UIs and backend systems. Bots and clients SHOULD NOT send this value to channels that have a central record of this store, but they MAY send this value to channels that populate the value on every activity (e.g. an email channel).

`A2062`: Channels SHOULD include the `from.name` field if the `from` field is present and `from.name` is available.

`A2063`: Bots and clients SHOULD NOT include the `from.name` field unless it is semantically valuable within the channel.

### Recipient

The `recipient` field describes which client or bot is receiving this activity. This field is only meaningful when an activity is transmitted to exactly one recipient; it is not meaningful when it is broadcast to multiple recipients (as happens when an activity is sent to a channel). The purpose of the field is to allow the recipient to identify themselves. This is helpful when a client or bot has more than one identity within the channel. The value of the `recipient` field is a complex object of the [Channel account](#channel-account) type.

`A2070`: Channels MUST include the `recipient` and `recipient.id` fields when transmitting an activity to a single recipient.

`A2071`: Bots and clients SHOULD NOT include the `recipient` field when generating an activity. The exception to this is when sending a [Suggestion activity](#suggestion-activity), in which case the recipient MUST identify the user that should receive the suggestion.

The `recipient.name` field is optional and represents the display name for the account within the channel. Channels SHOULD include this value so clients and bots can populate their UIs and backend systems.

`A2072`: Channels SHOULD include the `recipient.name` field if the `recipient` field is present and `recipient.name` is available.

### Conversation

The `conversation` field describes the conversation in which the activity exists. The value of the `conversation` field is a complex object of the [Conversation account](#conversation-account) type.

`A2080`: Channels, bots, and clients MUST include the `conversation` and `conversation.id` fields when generating an activity.

The `conversation.name` field is optional and represents the display name for the conversation if it exists and is available.

`A2081`: Channels SHOULD include the `conversation.name` and `conversation.isGroup` fields if they are available.

`A2082`: Bots and clients SHOULD NOT include the `conversation.name` field unless it is semantically valuable within the channel.

`A2083`: Bots and clients SHOULD NOT include the `conversation.isGroup` and `conversation.converationType` fields in activities they generate.

`A2084`: Channels SHOULD include the `conversation.conversationType` field if more than one value is defined for the channel. Channels SHOULD NOT include the field if there is only one possible value.

### Reply to ID

The `replyToId` field identifies the prior activity to which the current activity is a reply. This field allows threaded conversation and comment nesting to be communicated between participants. `replyToId` is valid only within the current conversation. (See [relatesTo](#relates-to) for references to other conversations.) The value of the `replyToId` field is a string.

`A2090`: Senders SHOULD include `replyToId` on an activity when it is a reply to another activity.

`A2091`: A channel MAY reject an activity if its `replyToId` does not reference a valid activity within the conversation.

`A2092`: Bots and clients MAY omit `replyToId` if it knows the channel does not make use of the field, even if the activity being sent is a reply to another activity.

### Entities

The `entities` field contains a flat list of metadata objects pertaining to this activity. Unlike attachments (see the [attachments](#attachments) field), entities do not necessarily manifest as user-interactable content elements, and are intended to be ignored if not understood. Senders may include entities they think may be useful to a receiver even if they are not certain the receiver can accept them. The value of each `entities` list element is a complex object of the [Entity](#entity) type.

`A2100`: Senders SHOULD omit the `entities` field if it contains no elements.

`A2101`: Senders MAY send multiple entities of the same type, provided the entities have distinct meaning.

`A2102`: Senders MUST NOT include two or more entities with identical types and contents.

`A2103`: Senders and receivers SHOULD NOT rely on specific ordering of the entities included in an activity.

`A2104`: Receivers MUST ignore entities whose types they do not understand.

`A2105`: Receivers SHOULD ignore entities whose type they understand but are unable to process due to e.g. syntactic errors.

### Channel data

Extensibility data in the activity schema is organized principally within the `channelData` field. This simplifies plumbing in SDKs that implement the protocol. The format of the `channelData` object is defined by the channel sending or receiving the activity.

`A2200`: Channels can define `channelData` formats that are JSON primitives (e.g., strings, ints). However, they SHOULD define `channelData` as a complex type, or leave it undefined.

`A2201`: If the `channelData` format is undefined for the current channel, receivers SHOULD ignore the contents of `channelData`.

### Caller ID

In some cases, it's important to record where an activity was sent. The `callerId` field is a string containing an [IRI](https://tools.ietf.org/html/rfc3987) [[3](#references)] identifying the caller of a bot, described in more detail in [Appendix V](#appendix-v---caller-id-values). This field is not intended to be transmitted over the wire, but is instead populated by bots and clients based on cryptographically verifiable data that asserts the identity of the callers (e.g. tokens).

`A2250`: Senders SHOULD NOT populate the `callerId` field.

`A2251`: Receivers SHOULD discard any data included in the `callerId` field on the wire.

`A2252`: Bots SHOULD, after receiving an Activity, populate its `callerId` field with an identifier described in [Appendix V](#appendix-v---caller-id-values)

### Service URL

Activities are frequently sent asynchronously, with separate transport connections for sending and receiving traffic. The `serviceUrl` field is used by channels to denote the URL where replies to the current activity may be sent. The value of the `serviceUrl` field is of type string.

`A2300`: Channels MUST include the `serviceUrl` field in all activities they send to bots.

`A2301`: Channels SHOULD NOT include the `serviceUrl` field to clients who demonstrate they already know the channel's endpoint.

`A2302`: Bots and clients SHOULD NOT populate the `serviceUrl` field in activities they generate.

`A2302`: Channels MUST ignore the value of `serviceUrl` in activities sent by bots and clients.

`A2304`: Channels SHOULD use stable values for the `serviceUrl` field as bots may persist them for long periods.
