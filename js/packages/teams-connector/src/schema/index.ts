/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as z from 'zod';
import { TokenExchangeInvokeRequest } from './tokenExchangeInvokeRequest';

export * from './activityInterfaces';
export * from './activityEx';

export { CallerIdConstants } from './callerIdConstants';
export { SpeechConstants } from './speechConstants';
export { TokenExchangeInvokeRequest } from './tokenExchangeInvokeRequest';
export { TokenExchangeInvokeResponse } from './tokenExchangeInvokeResponse';

// The Teams schemas was manually added to this library. This file has been updated to export those schemas.
export * from './teams';

/**
 * Attachment View name and size
 */
export interface AttachmentView {
    /**
     * Id of the attachment
     */
    viewId: string;
    /**
     * Size of the attachment
     */
    size: number;
}

const attachmentView = z.object({
    viewId: z.string(),
    size: z.number(),
});

/**
 * @internal
 */
export function assertAttachmentView(val: unknown, ..._args: unknown[]): asserts val is AttachmentView {
    attachmentView.parse(val);
}

/**
 * @internal
 */
export function isAttachmentView(val: unknown): val is AttachmentView {
    return attachmentView.check(val);
}

/**
 * Metadata for an attachment
 */
export interface AttachmentInfo {
    /**
     * Name of the attachment
     */
    name: string;
    /**
     * ContentType of the attachment
     */
    type: string;
    /**
     * attachment views
     */
    views: AttachmentView[];
}

const attachmentInfo = z.object({
    name: z.string(),
    type: z.string(),
    views: z.array(attachmentView),
});

/**
 * @internal
 */
export function assertAttachmentInfo(val: unknown, ..._args: unknown[]): asserts val is AttachmentInfo {
    attachmentInfo.parse(val);
}

/**
 * @internal
 */
export function isAttachmentInfo(val: unknown): val is AttachmentInfo {
    return attachmentInfo.check(val);
}

/**
 * Object representing inner http error
 */
export interface InnerHttpError {
    /**
     * HttpStatusCode from failed request
     */
    statusCode: number;
    /**
     * Body from failed request
     */
    body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Object representing error information
 */
export interface ErrorModel {
    /**
     * Error code
     */
    code: string;
    /**
     * Error message
     */
    message: string;
    /**
     * Error from inner http call
     */
    innerHttpError: InnerHttpError;
}

/**
 * An HTTP API response
 */
export interface ErrorResponse {
    /**
     * Error message
     */
    error: ErrorModel;
}

/**
 * Channel account information needed to route a message
 */
export interface ChannelAccount {
    /**
     * Channel id for the user or bot on this channel (Example: joe@smith.com, or @joesmith or
     * 123456)
     */
    id: string;
    /**
     * Display friendly name
     */
    name: string;
    /**
     * This account's object ID within Azure Active Directory (AAD)
     */
    aadObjectId?: string;
    /**
     * Role of the entity behind the account (Example: User, Bot, etc.). Possible values include:
     * 'user', 'bot', 'skill'
     */
    role?: RoleTypes | string;
}

const channelAccount = z.object({
    id: z.string(),
    name: z.string(),
    aadObjectId: z.string().optional(),
    role: z.string().optional(),
});

/**
 * @internal
 */
export function assertChannelAccount(val: unknown, ..._args: unknown[]): asserts val is ChannelAccount {
    channelAccount.parse(val);
}

/**
 * @internal
 */
export function isChannelAccount(val: unknown): val is ChannelAccount {
    return channelAccount.check(val);
}

/**
 * Channel account information for a conversation
 */
export interface ConversationAccount {
    /**
     * Indicates whether the conversation contains more than two participants at the time the
     * activity was generated
     */
    isGroup: boolean;
    /**
     * Indicates the type of the conversation in channels that distinguish between conversation types
     */
    conversationType: string;
    /**
     * This conversation's tenant ID
     */
    tenantId?: string;
    /**
     * Channel id for the user or bot on this channel (Example: joe@smith.com, or @joesmith or
     * 123456)
     */
    id: string;
    /**
     * Display friendly name
     */
    name: string;
    /**
     * This account's object ID within Azure Active Directory (AAD)
     */
    aadObjectId?: string;
    /**
     * Role of the entity behind the account (Example: User, Bot, etc.). Possible values include:
     * 'user', 'bot'
     */
    role?: RoleTypes;
    /**
     * Custom properties object (optional)
     */
    properties?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const conversationAccount = z.object({
    isGroup: z.boolean(),
    conversationType: z.string(),
    tenantId: z.string().optional(),
    id: z.string(),
    name: z.string(),
    aadObjectId: z.string().optional(),
    role: z.string().optional(),
    properties: z.unknown().optional(),
});

/**
 * @internal
 */
export function assertConversationAccount(val: unknown, ..._args: unknown[]): asserts val is ConversationAccount {
    conversationAccount.parse(val);
}

/**
 * @internal
 */
export function isConversationAccount(val: unknown): val is ConversationAccount {
    return conversationAccount.check(val);
}

/**
 * Message reaction object
 */
export interface MessageReaction {
    /**
     * Message reaction type. Possible values include: 'like', 'plusOne'
     */
    type: MessageReactionTypes | string;
}

const messageReaction = z.object({
    type: z.string(),
});

/**
 * @internal
 */
export function assertMessageReaction(val: unknown, ..._args: unknown[]): asserts val is MessageReaction {
    messageReaction.parse(val);
}

/**
 * @internal
 */
export function isMessageReaction(val: unknown): val is MessageReaction {
    return messageReaction.check(val);
}

/**
 * A clickable action
 */
export interface CardAction {
    /**
     * The type of action implemented by this button. Possible values include: 'openUrl', 'imBack',
     * 'postBack', 'playAudio', 'playVideo', 'showImage', 'downloadFile', 'signin', 'call',
     * messageBack', 'openApp'
     */
    type: ActionTypes | string;
    /**
     * Text description which appears on the button
     */
    title: string;
    /**
     * Image URL which will appear on the button, next to text label
     */
    image?: string;
    /**
     * Text for this action
     */
    text?: string;
    /**
     * (Optional) text to display in the chat feed if the button is clicked
     */
    displayText?: string;
    /**
     * Supplementary parameter for action. Content of this property depends on the ActionType
     */
    value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * Channel-specific data associated with this action
     */
    channelData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * Alternate image text to be used in place of the `image` field
     */
    imageAltText?: string;
}

const cardAction = z.object({
    type: z.string(),
    title: z.string(),
    image: z.string().optional(),
    text: z.string().optional(),
    displayText: z.string().optional(),
    value: z.unknown(),
    channelData: z.unknown(),
    imageAltText: z.string().optional(),
});

/**
 * @internal
 */
export function assertCardAction(val: unknown, ..._args: unknown[]): asserts val is CardAction {
    cardAction.parse(val);
}

/**
 * @internal
 */
export function isCardAction(val: unknown): val is CardAction {
    return cardAction.check(val);
}

/**
 * SuggestedActions that can be performed
 */
export interface SuggestedActions {
    /**
     * Ids of the recipients that the actions should be shown to.  These Ids are relative to the
     * channelId and a subset of all recipients of the activity
     */
    to: string[];
    /**
     * Actions that can be shown to the user
     */
    actions: CardAction[];
}

const suggestedActions = z.object({
    to: z.array(z.string()),
    actions: z.array(cardAction),
});

/**
 * @internal
 */
export function assertSuggestedActions(val: unknown, ..._args: unknown[]): asserts val is SuggestedActions {
    suggestedActions.parse(val);
}

/**
 * @internal
 */
export function isSuggestedActions(val: unknown): val is SuggestedActions {
    return suggestedActions.check(val);
}

/**
 * An attachment within an activity
 */
export interface Attachment {
    /**
     * mimetype/Contenttype for the file
     */
    contentType: string;
    /**
     * Content Url
     */
    contentUrl?: string;
    /**
     * Embedded content
     */
    content?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * (OPTIONAL) The name of the attachment
     */
    name?: string;
    /**
     * (OPTIONAL) Thumbnail associated with attachment
     */
    thumbnailUrl?: string;
}

const attachment = z.object({
    contentType: z.string(),
    contentUrl: z.string().optional(),
    content: z.unknown().optional(),
    name: z.string().optional(),
    thumbnailUrl: z.string().optional(),
});

/**
 * @internal
 */
export function assertAttachment(val: unknown, ..._args: unknown[]): asserts val is Attachment {
    attachment.parse(val);
}

/**
 * @internal
 */
export function isAttachment(val: unknown): val is Attachment {
    return attachment.check(val);
}

/**
 * Metadata object pertaining to an activity
 */
export interface Entity {
    /**
     * Type of this entity (RFC 3987 IRI)
     */
    type: string;
    /**
     * Additional properties.
     */
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const entity = z.record(z.unknown()).refine((val) => typeof val.type === 'string');

/**
 * @internal
 */
export function assertEntity(val: unknown, ..._args: unknown[]): asserts val is Entity {
    entity.parse(val);
}

/**
 * @internal
 */
export function isEntity(val: unknown): val is Entity {
    return entity.check(val);
}

/**
 * An object relating to a particular point in a conversation
 */
export interface ConversationReference {
    /**
     * (Optional) ID of the activity to refer to
     */
    activityId?: string;
    /**
     * (Optional) User participating in this conversation
     */
    user?: ChannelAccount;
    /**
     * A locale name for the contents of the text field.
     * The locale name is a combination of an ISO 639 two- or three-letter
     * culture code associated with a language and an ISO 3166 two-letter
     * subculture code associated with a country or region.
     * The locale name can also correspond to a valid BCP-47 language tag.
     */
    locale?: string;
    /**
     * Bot participating in this conversation
     */
    bot: ChannelAccount;
    /**
     * Conversation reference
     */
    conversation: ConversationAccount;
    /**
     * Channel ID
     */
    channelId: string;
    /**
     * Service endpoint where operations concerning the referenced conversation may be performed
     */
    serviceUrl: string;
}

const conversationReference = z.object({
    ActivityId: z.string().optional(),
    user: channelAccount.optional(),
    locale: z.string().optional(),
    bot: channelAccount,
    conversation: conversationAccount,
    channelId: z.string(),
    serviceUrl: z.string(),
});

/**
 * @internal
 */
export function assertConversationReference(val: unknown, ..._args: unknown[]): asserts val is ConversationReference {
    conversationReference.parse(val);
}

/**
 * @internal
 */
export function isConversationReference(val: unknown): val is ConversationReference {
    return conversationReference.check(val);
}

/**
 * Refers to a substring of content within another field
 */
export interface TextHighlight {
    /**
     * Defines the snippet of text to highlight
     */
    text: string;
    /**
     * Occurrence of the text field within the referenced text, if multiple exist.
     */
    occurrence: number;
}

const textHighlight = z.object({
    text: z.string(),
    occurrence: z.number(),
});

/**
 * Represents a reference to a programmatic action
 */
export interface SemanticAction {
    /**
     * ID of this action
     */
    id: string;
    /**
     * State of this action. Allowed values: 'start', 'continue', 'done'
     */
    state: SemanticActionStateTypes | string;
    /**
     * Entities associated with this action
     */
    entities: { [propertyName: string]: Entity };
}

const semanticAction = z.object({
    id: z.string(),
    state: z.string(),
    entities: z.record(entity),
});

/**
 * @internal
 */
export function assertSemanticAction(val: unknown, ..._args: unknown[]): asserts val is SemanticAction {
    semanticAction.parse(val);
}

/**
 * @internal
 */
export function isSemanticAction(val: unknown): val is SemanticAction {
    return semanticAction.check(val);
}

/**
 * An Activity is the basic communication type for the Bot Framework 3.0 protocol.
 */
export interface Activity {
    /**
     * Contains the activity type. Possible values include: 'message', 'contactRelationUpdate',
     * 'conversationUpdate', 'typing', 'endOfConversation', 'event', 'invoke', 'deleteUserData',
     * 'messageUpdate', 'messageDelete', 'installationUpdate', 'messageReaction', 'suggestion',
     * 'trace', 'handoff'
     */
    type: ActivityTypes | string;
    /**
     * Contains an ID that uniquely identifies the activity on the channel.
     */
    id?: string;
    /**
     * Contains the date and time that the message was sent, in UTC, expressed in ISO-8601 format.
     */
    timestamp?: Date;
    /**
     * Contains the local date and time of the message, expressed in ISO-8601 format.
     * For example, 2016-09-23T13:07:49.4714686-07:00.
     */
    localTimestamp?: Date;
    /**
     * Contains the name of the local timezone of the message, expressed in IANA Time Zone database format.
     * For example, America/Los_Angeles.
     */
    localTimezone: string;
    /**
     * A string containing a URI identifying the caller of a bot. This field is not intended to be transmitted over
     * the wire, but is instead populated by bots and clients based on cryptographically verifiable data that asserts
     * the identity of the callers (e.g. tokens).
     */
    callerId: string;
    /**
     * Contains the URL that specifies the channel's service endpoint. Set by the channel.
     */
    serviceUrl: string;
    /**
     * Contains an ID that uniquely identifies the channel. Set by the channel.
     */
    channelId: string;
    /**
     * Identifies the sender of the message.
     */
    from: ChannelAccount;
    /**
     * Identifies the conversation to which the activity belongs.
     */
    conversation: ConversationAccount;
    /**
     * Identifies the recipient of the message.
     */
    recipient: ChannelAccount;
    /**
     * Format of text fields Default:markdown. Possible values include: 'markdown', 'plain', 'xml'
     */
    textFormat?: TextFormatTypes | string;
    /**
     * The layout hint for multiple attachments. Default: list. Possible values include: 'list',
     * 'carousel'
     */
    attachmentLayout?: AttachmentLayoutTypes | string;
    /**
     * The collection of members added to the conversation.
     */
    membersAdded?: ChannelAccount[];
    /**
     * The collection of members removed from the conversation.
     */
    membersRemoved?: ChannelAccount[];
    /**
     * The collection of reactions added to the conversation.
     */
    reactionsAdded?: MessageReaction[];
    /**
     * The collection of reactions removed from the conversation.
     */
    reactionsRemoved?: MessageReaction[];
    /**
     * The updated topic name of the conversation.
     */
    topicName?: string;
    /**
     * Indicates whether the prior history of the channel is disclosed.
     */
    historyDisclosed?: boolean;
    /**
     * A locale name for the contents of the text field.
     * The locale name is a combination of an ISO 639 two- or three-letter culture code associated
     * with a language
     * and an ISO 3166 two-letter subculture code associated with a country or region.
     * The locale name can also correspond to a valid BCP-47 language tag.
     */
    locale?: string;
    /**
     * The text content of the message.
     */
    text: string;
    /**
     * The text to speak.
     */
    speak?: string;
    /**
     * Indicates whether your bot is accepting,
     * expecting, or ignoring user input after the message is delivered to the client. Possible
     * values include: 'acceptingInput', 'ignoringInput', 'expectingInput'
     */
    inputHint?: InputHints | string;
    /**
     * The text to display if the channel cannot render cards.
     */
    summary?: string;
    /**
     * The suggested actions for the activity.
     */
    suggestedActions?: SuggestedActions;
    /**
     * Attachments
     */
    attachments?: Attachment[];
    /**
     * Represents the entities that were mentioned in the message.
     */
    entities?: Entity[];
    /**
     * Contains channel-specific content.
     */
    channelData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * Indicates whether the recipient of a contactRelationUpdate was added or removed from the
     * sender's contact list.
     */
    action?: string;
    /**
     * Contains the ID of the message to which this message is a reply.
     */
    replyToId?: string;
    /**
     * A descriptive label for the activity.
     */
    label: string;
    /**
     * The type of the activity's value object.
     */
    valueType: string;
    /**
     * A value that is associated with the activity.
     */
    value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * The name of the operation associated with an invoke or event activity.
     */
    name?: ActivityEventNames | string;
    /**
     * A reference to another conversation or activity.
     */
    relatesTo?: ConversationReference;
    /**
     * The a code for endOfConversation activities that indicates why the conversation ended.
     * Possible values include: 'unknown', 'completedSuccessfully', 'userCancelled', 'botTimedOut',
     * 'botIssuedInvalidMessage', 'channelFailed'
     */
    code?: EndOfConversationCodes | string;
    /**
     * The time at which the activity should be considered to be "expired" and should not be
     * presented to the recipient.
     */
    expiration?: Date;
    /**
     * The importance of the activity. Possible values include: 'low', 'normal', 'high'
     */
    importance?: ActivityImportance | string;
    /**
     * A delivery hint to signal to the recipient alternate delivery paths for the activity.
     * The default delivery mode is "default". Possible values include: 'normal', 'notification', 'expectReplies', 'ephemeral'
     */
    deliveryMode?: DeliveryModes | string;
    /**
     * List of phrases and references that speech and language priming systems should listen for
     */
    listenFor: string[];
    /**
     * The collection of text fragments to highlight when the activity contains a ReplyToId value.
     */
    textHighlights?: TextHighlight[];
    /**
     * An optional programmatic action accompanying this request
     */
    semanticAction?: SemanticAction;
}

const activity = z.object({
    type: z.string(),
    id: z.string().optional(),
    timestamp: z.instanceof(Date).optional(),
    localTimestamp: z.instanceof(Date).optional(),
    localTimezone: z.string(),
    callerId: z.string(),
    serviceUrl: z.string(),
    channelId: z.string(),
    from: channelAccount,
    conversation: conversationAccount,
    recipient: channelAccount,
    textFormat: z.string().optional(),
    attachmentLayout: z.string().optional(),
    membersAdded: z.array(channelAccount).optional(),
    membersRemoved: z.array(channelAccount).optional(),
    reactionsAdded: z.array(messageReaction).optional(),
    reactionsRemoved: z.array(messageReaction).optional(),
    topicName: z.string().optional(),
    historyDisclosed: z.boolean().optional(),
    locale: z.string().optional(),
    text: z.string(),
    speak: z.string().optional(),
    inputHint: z.string().optional(),
    summary: z.string().optional(),
    suggestedActions: suggestedActions.optional(),
    attachments: z.array(attachment).optional(),
    entities: z.array(entity).optional(),
    channelData: z.unknown().optional(),
    action: z.string().optional(),
    replyToId: z.string().optional(),
    label: z.string(),
    valueType: z.string(),
    value: z.unknown().optional(),
    name: z.string().optional(),
    relatesTo: conversationReference.optional(),
    code: z.string().optional(),
    importance: z.string().optional(),
    deliveryMode: z.string().optional(),
    listenFor: z.array(z.string()).optional(),
    textHighlights: z.array(textHighlight).optional(),
    semanticAction: semanticAction.optional(),
});

/**
 * @internal
 */
export function assertActivity(val: unknown, ..._args: unknown[]): asserts val is Activity {
    activity.parse(val);
}

/**
 * @internal
 */
export function isActivity(val: unknown): val is Activity {
    return activity.check(val);
}

/**
 * This interface is used to preserve the original string values of dates on Activities.
 * When an Activity is received, timestamps are converted to Dates.  Due to how Javascript
 * Date objects are UTC, timezone offset values are lost.
 */
export interface ActivityTimestamps extends Activity {
    rawTimestamp?: string;
    rawExpiration?: string;
    rawLocalTimestamp?: string;
}

/**
 * Parameters for creating a new conversation
 */
export interface ConversationParameters {
    /**
     * IsGroup
     */
    isGroup: boolean;
    /**
     * The bot address for this conversation
     */
    bot: ChannelAccount;
    /**
     * Members to add to the conversation
     */
    members?: ChannelAccount[];
    /**
     * (Optional) Topic of the conversation (if supported by the channel)
     */
    topicName?: string;
    /**
     * (Optional) The tenant ID in which the conversation should be created
     */
    tenantId?: string;
    /**
     * (Optional) When creating a new conversation, use this activity as the initial message to the
     * conversation
     */
    activity: Activity;
    /**
     * Channel specific payload for creating the conversation
     */
    channelData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * A response containing a resource
 */
export interface ConversationResourceResponse {
    /**
     * ID of the Activity (if sent)
     */
    activityId: string;
    /**
     * Service endpoint where operations concerning the conversation may be performed
     */
    serviceUrl: string;
    /**
     * Id of the resource
     */
    id: string;
}

/**
 * Conversation and its members
 */
export interface ConversationMembers {
    /**
     * Conversation ID
     */
    id: string;
    /**
     * List of members in this conversation
     */
    members: ChannelAccount[];
}

/**
 * Conversations result
 */
export interface ConversationsResult {
    /**
     * Paging token
     */
    continuationToken: string;
    /**
     * List of conversations
     */
    conversations: ConversationMembers[];
}

/**
 * Expected Replies in response to DeliveryModes.ExpectReplies
 */
export interface ExpectedReplies {
    /**
     * A collection of Activities that conforms to the ExpectedReplies schema.
     */
    activities: Activity[];
}

/**
 * A response containing a resource ID
 */
export interface ResourceResponse {
    /**
     * Id of the resource
     */
    id: string;
}

/**
 * Transcript
 */
export interface Transcript {
    /**
     * A collection of Activities that conforms to the Transcript schema.
     */
    activities: Activity[];
}

/**
 * Page of members.
 */
export interface PagedMembersResult {
    /**
     * Paging token
     */
    continuationToken: string;
    /**
     * The Channel Accounts.
     */
    members: ChannelAccount[];
}

/**
 * Attachment data
 */
export interface AttachmentData {
    /**
     * Content-Type of the attachment
     */
    type: string;
    /**
     * Name of the attachment
     */
    name: string;
    /**
     * Attachment content
     */
    originalBase64: Uint8Array;
    /**
     * Attachment thumbnail
     */
    thumbnailBase64: Uint8Array;
}

/**
 * An image on a card
 */
export interface CardImage {
    /**
     * URL thumbnail image for major content property
     */
    url: string;
    /**
     * Image description intended for screen readers
     */
    alt?: string;
    /**
     * Action assigned to specific Attachment
     */
    tap?: CardAction;
}

/**
 * A Hero card (card with a single, large image)
 */
export interface HeroCard {
    /**
     * Title of the card
     */
    title: string;
    /**
     * Subtitle of the card
     */
    subtitle: string;
    /**
     * Text for the card
     */
    text: string;
    /**
     * Array of images for the card
     */
    images: CardImage[];
    /**
     * Set of actions applicable to the current card
     */
    buttons: CardAction[];
    /**
     * This action will be activated when user taps on the card itself
     */
    tap: CardAction;
}

/**
 * Thumbnail URL
 */
export interface ThumbnailUrl {
    /**
     * URL pointing to the thumbnail to use for media content
     */
    url: string;
    /**
     * HTML alt text to include on this thumbnail image
     */
    alt: string;
}

/**
 * Media URL
 */
export interface MediaUrl {
    /**
     * Url for the media
     */
    url: string;
    /**
     * Optional profile hint to the client to differentiate multiple MediaUrl objects from each other
     */
    profile?: string;
}

/**
 * An animation card (Ex: gif or short video clip)
 */
export interface AnimationCard {
    /**
     * Title of this card
     */
    title: string;
    /**
     * Subtitle of this card
     */
    subtitle: string;
    /**
     * Text of this card
     */
    text: string;
    /**
     * Thumbnail placeholder
     */
    image: ThumbnailUrl;
    /**
     * Media URLs for this card. When this field contains more than one URL, each URL is an
     * alternative format of the same content.
     */
    media: MediaUrl[];
    /**
     * Actions on this card
     */
    buttons: CardAction[];
    /**
     * This content may be shared with others (default:true)
     */
    shareable: boolean;
    /**
     * Should the client loop playback at end of content (default:true)
     */
    autoloop: boolean;
    /**
     * Should the client automatically start playback of media in this card (default:true)
     */
    autostart: boolean;
    /**
     * Aspect ratio of thumbnail/media placeholder. Allowed values are "16:9" and "4:3"
     */
    aspect: string;
    /**
     * Describes the length of the media content without requiring a receiver to open the content.
     * Formatted as an ISO 8601 Duration field.
     */
    duration: string;
    /**
     * Supplementary parameter for this card
     */
    value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Audio card
 */
export interface AudioCard {
    /**
     * Title of this card
     */
    title: string;
    /**
     * Subtitle of this card
     */
    subtitle: string;
    /**
     * Text of this card
     */
    text: string;
    /**
     * Thumbnail placeholder
     */
    image: ThumbnailUrl;
    /**
     * Media URLs for this card. When this field contains more than one URL, each URL is an
     * alternative format of the same content.
     */
    media: MediaUrl[];
    /**
     * Actions on this card
     */
    buttons: CardAction[];
    /**
     * This content may be shared with others (default:true)
     */
    shareable: boolean;
    /**
     * Should the client loop playback at end of content (default:true)
     */
    autoloop: boolean;
    /**
     * Should the client automatically start playback of media in this card (default:true)
     */
    autostart: boolean;
    /**
     * Aspect ratio of thumbnail/media placeholder. Allowed values are "16:9" and "4:3"
     */
    aspect: string;
    /**
     * Describes the length of the media content without requiring a receiver to open the content.
     * Formatted as an ISO 8601 Duration field.
     */
    duration: string;
    /**
     * Supplementary parameter for this card
     */
    value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * A basic card
 */
export interface BasicCard {
    /**
     * Title of the card
     */
    title: string;
    /**
     * Subtitle of the card
     */
    subtitle: string;
    /**
     * Text for the card
     */
    text: string;
    /**
     * Array of images for the card
     */
    images: CardImage[];
    /**
     * Set of actions applicable to the current card
     */
    buttons: CardAction[];
    /**
     * This action will be activated when user taps on the card itself
     */
    tap: CardAction;
}

/**
 * Media card
 */
export interface MediaCard {
    /**
     * Title of this card
     */
    title: string;
    /**
     * Subtitle of this card
     */
    subtitle: string;
    /**
     * Text of this card
     */
    text: string;
    /**
     * Thumbnail placeholder
     */
    image: ThumbnailUrl;
    /**
     * Media URLs for this card. When this field contains more than one URL, each URL is an
     * alternative format of the same content.
     */
    media: MediaUrl[];
    /**
     * Actions on this card
     */
    buttons: CardAction[];
    /**
     * This content may be shared with others (default:true)
     */
    shareable: boolean;
    /**
     * Should the client loop playback at end of content (default:true)
     */
    autoloop: boolean;
    /**
     * Should the client automatically start playback of media in this card (default:true)
     */
    autostart: boolean;
    /**
     * Aspect ratio of thumbnail/media placeholder. Allowed values are "16:9" and "4:3"
     */
    aspect: string;
    /**
     * Describes the length of the media content without requiring a receiver to open the content.
     * Formatted as an ISO 8601 Duration field.
     */
    duration: string;
    /**
     * Supplementary parameter for this card
     */
    value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Set of key-value pairs. Advantage of this section is that key and value properties will be
 * rendered with default style information with some delimiter between them. So there is no need
 * for developer to specify style information.
 */
export interface Fact {
    /**
     * The key for this Fact
     */
    key: string;
    /**
     * The value for this Fact
     */
    value: string;
}

/**
 * An item on a receipt card
 */
export interface ReceiptItem {
    /**
     * Title of the Card
     */
    title: string;
    /**
     * Subtitle appears just below Title field, differs from Title in font styling only
     */
    subtitle: string;
    /**
     * Text field appears just below subtitle, differs from Subtitle in font styling only
     */
    text: string;
    /**
     * Image
     */
    image: CardImage;
    /**
     * Amount with currency
     */
    price: string;
    /**
     * Number of items of given kind
     */
    quantity: string;
    /**
     * This action will be activated when user taps on the Item bubble.
     */
    tap: CardAction;
}

/**
 * A receipt card
 */
export interface ReceiptCard {
    /**
     * Title of the card
     */
    title: string;
    /**
     * Array of Fact objects
     */
    facts: Fact[];
    /**
     * Array of Receipt Items
     */
    items: ReceiptItem[];
    /**
     * This action will be activated when user taps on the card
     */
    tap: CardAction;
    /**
     * Total amount of money paid (or to be paid)
     */
    total: string;
    /**
     * Total amount of tax paid (or to be paid)
     */
    tax: string;
    /**
     * Total amount of VAT paid (or to be paid)
     */
    vat: string;
    /**
     * Set of actions applicable to the current card
     */
    buttons: CardAction[];
}

/**
 * A card representing a request to sign in
 */
export interface SigninCard {
    /**
     * Text for signin request
     */
    text?: string;
    /**
     * Action to use to perform signin
     */
    buttons: CardAction[];
}

/**
 * A card representing a request to perform a sign in via OAuth
 */
export interface OAuthCard {
    /**
     * Text for signin request
     */
    text: string;
    /**
     * The name of the registered connection
     */
    connectionName: string;
    /**
     * The token exchange resource for single sign on
     */
    tokenExchangeResource: TokenExchangeResource;
    /**
     * The token for directly post a token to token service
     */
    tokenPostResource: TokenPostResource;
    /**
     * Action to use to perform signin
     */
    buttons: CardAction[];
}

/**
 * A thumbnail card (card with a single, small thumbnail image)
 */
export interface ThumbnailCard {
    /**
     * Title of the card
     */
    title: string;
    /**
     * Subtitle of the card
     */
    subtitle: string;
    /**
     * Text for the card
     */
    text: string;
    /**
     * Array of images for the card
     */
    images: CardImage[];
    /**
     * Set of actions applicable to the current card
     */
    buttons: CardAction[];
    /**
     * This action will be activated when user taps on the card itself
     */
    tap: CardAction;
}

/**
 * Video card
 */
export interface VideoCard {
    /**
     * Title of this card
     */
    title: string;
    /**
     * Subtitle of this card
     */
    subtitle: string;
    /**
     * Text of this card
     */
    text: string;
    /**
     * Thumbnail placeholder
     */
    image: ThumbnailUrl;
    /**
     * Media URLs for this card. When this field contains more than one URL, each URL is an
     * alternative format of the same content.
     */
    media: MediaUrl[];
    /**
     * Actions on this card
     */
    buttons: CardAction[];
    /**
     * This content may be shared with others (default:true)
     */
    shareable: boolean;
    /**
     * Should the client loop playback at end of content (default:true)
     */
    autoloop: boolean;
    /**
     * Should the client automatically start playback of media in this card (default:true)
     */
    autostart: boolean;
    /**
     * Aspect ratio of thumbnail/media placeholder. Allowed values are "16:9" and "4:3"
     */
    aspect: string;
    /**
     * Describes the length of the media content without requiring a receiver to open the content.
     * Formatted as an ISO 8601 Duration field.
     */
    duration: string;
    /**
     * Supplementary parameter for this card
     */
    value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * GeoCoordinates (entity type: "https://schema.org/GeoCoordinates")
 */
export interface GeoCoordinates {
    /**
     * Elevation of the location [WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)
     */
    elevation: number;
    /**
     * Latitude of the location [WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)
     */
    latitude: number;
    /**
     * Longitude of the location [WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)
     */
    longitude: number;
    /**
     * The type of the thing
     */
    type: string;
    /**
     * The name of the thing
     */
    name: string;
}

/**
 * Mention information (entity type: "mention")
 */
export interface Mention {
    /**
     * The mentioned user
     */
    mentioned: ChannelAccount;
    /**
     * Sub Text which represents the mention (can be null or empty)
     */
    text: string;
    /**
     * Type of this entity (RFC 3987 IRI)
     */
    type: string;
}

/**
 * Place (entity type: "https://schema.org/Place")
 */
export interface Place {
    /**
     * Address of the place (may be `string` or complex object of type `PostalAddress`)
     */
    address: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * Geo coordinates of the place (may be complex object of type `GeoCoordinates` or `GeoShape`)
     */
    geo: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * Map to the place (may be `string` (URL) or complex object of type `Map`)
     */
    hasMap: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * The type of the thing
     */
    type: string;
    /**
     * The name of the thing
     */
    name: string;
}

/**
 * Thing (entity type: "https://schema.org/Thing")
 */
export interface Thing {
    /**
     * The type of the thing
     */
    type: string;
    /**
     * The name of the thing
     */
    name: string;
}

/**
 * Supplementary parameter for media events
 */
export interface MediaEventValue {
    /**
     * Callback parameter specified in the Value field of the MediaCard that originated this event
     */
    cardValue: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * A request to receive a user token
 */
export interface TokenRequest {
    /**
     * The provider to request a user token from
     */
    provider: string;
    /**
     * A collection of settings for the specific provider for this request
     */
    settings: { [propertyName: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * A response that includes a user token
 */
export interface TokenResponse {
    /**
     * @member {string} [channelId]
     */
    channelId?: string;
    /**
     * The connection name
     */
    connectionName: string;
    /**
     * The user token
     */
    token: string;
    /**
     * Expiration for the token, in ISO 8601 format (e.g. "2007-04-05T14:30Z")
     */
    expiration: string;
    /**
     * A collection of properties about this response, such as token polling parameters
     */
    properties?: { [propertyName: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * W3C Payment Method Data for Microsoft Pay
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface MicrosoftPayMethodData {
    /**
     * Microsoft Pay Merchant ID
     */
    merchantId: string;
    /**
     * Supported payment networks (e.g., "visa" and "mastercard")
     */
    supportedNetworks: string[];
    /**
     * Supported payment types (e.g., "credit")
     */
    supportedTypes: string[];
}

/**
 * Address within a Payment Request
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentAddress {
    /**
     * This is the CLDR (Common Locale Data Repository) region code. For example, US, GB, CN, or JP
     */
    country: string;
    /**
     * This is the most specific part of the address. It can include, for example, a street name, a
     * house number, apartment number, a rural delivery route, descriptive instructions, or a post
     * office box number.
     */
    addressLine: string[];
    /**
     * This is the top level administrative subdivision of the country. For example, this can be a
     * state, a province, an oblast, or a prefecture.
     */
    region: string;
    /**
     * This is the city/town portion of the address.
     */
    city: string;
    /**
     * This is the dependent locality or sublocality within a city. For example, used for
     * neighborhoods, boroughs, districts, or UK dependent localities.
     */
    dependentLocality: string;
    /**
     * This is the postal code or ZIP code, also known as PIN code in India.
     */
    postalCode: string;
    /**
     * This is the sorting code as used in, for example, France.
     */
    sortingCode: string;
    /**
     * This is the BCP-47 language code for the address. It's used to determine the field separators
     * and the order of fields when formatting the address for display.
     */
    languageCode: string;
    /**
     * This is the organization, firm, company, or institution at this address.
     */
    organization: string;
    /**
     * This is the name of the recipient or contact person.
     */
    recipient: string;
    /**
     * This is the phone number of the recipient or contact person.
     */
    phone: string;
}

/**
 * Supplies monetary amounts
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentCurrencyAmount {
    /**
     * A currency identifier
     */
    currency: string;
    /**
     * Decimal monetary value
     */
    value: string;
    /**
     * Currency system
     */
    currencySystem: string;
}

/**
 * Indicates what the payment request is for and the value asked for
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentItem {
    /**
     * Human-readable description of the item
     */
    label: string;
    /**
     * Monetary amount for the item
     */
    amount: PaymentCurrencyAmount;
    /**
     * When set to true this flag means that the amount field is not final.
     */
    pending: boolean;
}

/**
 * Describes a shipping option
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentShippingOption {
    /**
     * String identifier used to reference this PaymentShippingOption
     */
    id: string;
    /**
     * Human-readable description of the item
     */
    label: string;
    /**
     * Contains the monetary amount for the item
     */
    amount: PaymentCurrencyAmount;
    /**
     * Indicates whether this is the default selected PaymentShippingOption
     */
    selected: boolean;
}

/**
 * Provides details that modify the PaymentDetails based on payment method identifier
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentDetailsModifier {
    /**
     * Contains a sequence of payment method identifiers
     */
    supportedMethods: string[];
    /**
     * This value overrides the total field in the PaymentDetails dictionary for the payment method
     * identifiers in the supportedMethods field
     */
    total: PaymentItem;
    /**
     * Provides additional display items that are appended to the displayItems field in the
     * PaymentDetails dictionary for the payment method identifiers in the supportedMethods field
     */
    additionalDisplayItems: PaymentItem[];
    /**
     * A JSON-serializable object that provides optional information that might be needed by the
     * supported payment methods
     */
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Provides information about the requested transaction
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentDetails {
    /**
     * Contains the total amount of the payment request
     */
    total: PaymentItem;
    /**
     * Contains line items for the payment request that the user agent may display
     */
    displayItems: PaymentItem[];
    /**
     * A sequence containing the different shipping options for the user to choose from
     */
    shippingOptions: PaymentShippingOption[];
    /**
     * Contains modifiers for particular payment method identifiers
     */
    modifiers: PaymentDetailsModifier[];
    /**
     * Error description
     */
    error: string;
}

/**
 * Indicates a set of supported payment methods and any associated payment method specific data for
 * those methods
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentMethodData {
    /**
     * Required sequence of strings containing payment method identifiers for payment methods that
     * the merchant web site accepts
     */
    supportedMethods: string[];
    /**
     * A JSON-serializable object that provides optional information that might be needed by the
     * supported payment methods
     */
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Provides information about the options desired for the payment request
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentOptions {
    /**
     * Indicates whether the user agent should collect and return the payer's name as part of the
     * payment request
     */
    requestPayerName: boolean;
    /**
     * Indicates whether the user agent should collect and return the payer's email address as part
     * of the payment request
     */
    requestPayerEmail: boolean;
    /**
     * Indicates whether the user agent should collect and return the payer's phone number as part of
     * the payment request
     */
    requestPayerPhone: boolean;
    /**
     * Indicates whether the user agent should collect and return a shipping address as part of the
     * payment request
     */
    requestShipping: boolean;
    /**
     * If requestShipping is set to true, then the shippingType field may be used to influence the
     * way the user agent presents the user interface for gathering the shipping address
     */
    shippingType: string;
}

/**
 * A request to make a payment
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentRequest {
    /**
     * ID of this payment request
     */
    id: string;
    /**
     * Allowed payment methods for this request
     */
    methodData: PaymentMethodData[];
    /**
     * Details for this request
     */
    details: PaymentDetails;
    /**
     * Provides information about the options desired for the payment request
     */
    options: PaymentOptions;
    /**
     * Expiration for this request, in ISO 8601 duration format (e.g., 'P1D')
     */
    expires: string;
}

/**
 * A PaymentResponse is returned when a user has selected a payment method and approved a payment
 * request
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentResponse {
    /**
     * The payment method identifier for the payment method that the user selected to fulfil the
     * transaction
     */
    methodName: string;
    /**
     * A JSON-serializable object that provides a payment method specific message used by the
     * merchant to process the transaction and determine successful fund transfer
     */
    details: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * If the requestShipping flag was set to true in the PaymentOptions passed to the PaymentRequest
     * constructor, then shippingAddress will be the full and final shipping address chosen by the
     * user
     */
    shippingAddress: PaymentAddress;
    /**
     * If the requestShipping flag was set to true in the PaymentOptions passed to the PaymentRequest
     * constructor, then shippingOption will be the id attribute of the selected shipping option
     */
    shippingOption: string;
    /**
     * If the requestPayerEmail flag was set to true in the PaymentOptions passed to the
     * PaymentRequest constructor, then payerEmail will be the email address chosen by the user
     */
    payerEmail: string;
    /**
     * If the requestPayerPhone flag was set to true in the PaymentOptions passed to the
     * PaymentRequest constructor, then payerPhone will be the phone number chosen by the user
     */
    payerPhone: string;
}

/**
 * Payload delivered when completing a payment request
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentRequestComplete {
    /**
     * Payment request ID
     */
    id: string;
    /**
     * Initial payment request
     */
    paymentRequest: PaymentRequest;
    /**
     * Corresponding payment response
     */
    paymentResponse: PaymentResponse;
}

/**
 * Result from a completed payment request
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentRequestCompleteResult {
    /**
     * Result of the payment request completion
     */
    result: string;
}

/**
 * An update to a payment request
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentRequestUpdate {
    /**
     * ID for the payment request to update
     */
    id: string;
    /**
     * Update payment details
     */
    details: PaymentDetails;
    /**
     * Updated shipping address
     */
    shippingAddress: PaymentAddress;
    /**
     * Updated shipping options
     */
    shippingOption: string;
}

/**
 * A result object from a Payment Request Update invoke operation
 *
 * @deprecated Bot Framework no longer supports payments
 */
export interface PaymentRequestUpdateResult {
    /**
     * Update payment details
     */
    details: PaymentDetails;
}

/**
 * @interface
 * An interface representing SignInUrlResponse.
 */
export interface SignInUrlResponse {
    /**
     * @member {string} [signInLink]
     */
    signInLink?: string;
    /**
     * @member {TokenExchangeResource} [tokenExchangeResource]
     */
    tokenExchangeResource?: TokenExchangeResource;
    /**
     * @member {TokenPostResource} [tokenPostResource]
     */
    tokenPostResource?: TokenPostResource;
}

/**
 * @interface
 * An interface representing TokenExchangeResource.
 */
export interface TokenExchangeResource {
    /**
     * @member {string} [id]
     */
    id?: string;
    /**
     * @member {string} [uri]
     */
    uri?: string;
    /**
     * @member {string} [providerId]
     */
    providerId?: string;
}

/**
 * @interface
 * An interface representing TokenPostResource.
 */
export interface TokenPostResource {
    /**
     * @member {string} [sasUrl]
     */
    sasUrl?: string;
}

/**
 * @interface
 * An interface representing TokenExchangeRequest.
 */
export interface TokenExchangeRequest {
    /**
     * @member {string} [uri]
     */
    uri?: string;
    /**
     * @member {string} [token]
     */
    token?: string;
}

/**
 * Defines values for RoleTypes.
 * Possible values include: 'user', 'bot', 'skill'
 *
 * @readonly
 * @enum {string}
 */
export enum RoleTypes {
    User = 'user',
    Bot = 'bot',
    Skill = 'skill',
}

/**
 * Defines values for ActivityEventNames.
 * Possible values include: 'continueConversation', 'createConversation'
 *
 * @readonly
 * @enum {string}
 */
export enum ActivityEventNames {
    ContinueConversation = 'ContinueConversation',
    CreateConversation = 'CreateConversation',
}

/**
 * Defines values for ActivityTypes.
 * Possible values include: 'message', 'contactRelationUpdate', 'conversationUpdate', 'typing',
 * 'endOfConversation', 'event', 'invoke', 'deleteUserData', 'messageUpdate', 'messageDelete',
 * 'installationUpdate', 'messageReaction', 'suggestion', 'trace', 'handoff'
 *
 * @readonly
 * @enum {string}
 */
export enum ActivityTypes {
    Message = 'message',
    ContactRelationUpdate = 'contactRelationUpdate',
    ConversationUpdate = 'conversationUpdate',
    Typing = 'typing',
    EndOfConversation = 'endOfConversation',
    Event = 'event',
    Invoke = 'invoke',
    InvokeResponse = 'invokeResponse',
    DeleteUserData = 'deleteUserData',
    MessageUpdate = 'messageUpdate',
    MessageDelete = 'messageDelete',
    InstallationUpdate = 'installationUpdate',
    MessageReaction = 'messageReaction',
    Suggestion = 'suggestion',
    Trace = 'trace',
    Handoff = 'handoff',
    Command = 'command',
    CommandResult = 'commandResult',
}

/**
 * Defines values for TextFormatTypes.
 * Possible values include: 'markdown', 'plain', 'xml'
 *
 * @readonly
 * @enum {string}
 */
export enum TextFormatTypes {
    Markdown = 'markdown',
    Plain = 'plain',
    Xml = 'xml',
}

/**
 * Defines values for AttachmentLayoutTypes.
 * Possible values include: 'list', 'carousel'
 *
 * @readonly
 * @enum {string}
 */
export enum AttachmentLayoutTypes {
    List = 'list',
    Carousel = 'carousel',
}

/**
 * Defines values for MessageReactionTypes.
 * Possible values include: 'like', 'plusOne'
 *
 * @readonly
 * @enum {string}
 */
export enum MessageReactionTypes {
    Like = 'like',
    PlusOne = 'plusOne',
}

/**
 * Defines values for InputHints.
 * Possible values include: 'acceptingInput', 'ignoringInput', 'expectingInput'
 *
 * @readonly
 * @enum {string}
 */
export enum InputHints {
    AcceptingInput = 'acceptingInput',
    IgnoringInput = 'ignoringInput',
    ExpectingInput = 'expectingInput',
}

/**
 * Defines values for ActionTypes.
 * Possible values include: 'openUrl', 'imBack', 'postBack', 'playAudio', 'playVideo', 'showImage',
 * 'downloadFile', 'signin', 'call', messageBack', 'openApp'
 *
 * @readonly
 * @enum {string}
 */
export enum ActionTypes {
    OpenUrl = 'openUrl',
    ImBack = 'imBack',
    PostBack = 'postBack',
    PlayAudio = 'playAudio',
    PlayVideo = 'playVideo',
    ShowImage = 'showImage',
    DownloadFile = 'downloadFile',
    Signin = 'signin',
    Call = 'call',
    // @deprecated Bot Framework no longer supports payments
    Payment = 'payment',
    MessageBack = 'messageBack',
    OpenApp = 'openApp',
}

/**
 * Defines values for EndOfConversationCodes.
 * Possible values include: 'unknown', 'completedSuccessfully', 'userCancelled', 'botTimedOut',
 * 'botIssuedInvalidMessage', 'channelFailed'
 *
 * @readonly
 * @enum {string}
 */
export enum EndOfConversationCodes {
    Unknown = 'unknown',
    CompletedSuccessfully = 'completedSuccessfully',
    UserCancelled = 'userCancelled',
    BotTimedOut = 'botTimedOut',
    BotIssuedInvalidMessage = 'botIssuedInvalidMessage',
    ChannelFailed = 'channelFailed',
}

/**
 * Defines values for ActivityImportance.
 * Possible values include: 'low', 'normal', 'high'
 *
 * @readonly
 * @enum {string}
 */
export enum ActivityImportance {
    Low = 'low',
    Normal = 'normal',
    High = 'high',
}

/**
 * Defines values for DeliveryModes.
 * Possible values include: 'normal', 'notification', 'expectReplies', 'ephemeral'
 *
 * @readonly
 * @enum {string}
 */
export enum DeliveryModes {
    Normal = 'normal',
    Notification = 'notification',
    ExpectReplies = 'expectReplies',
    Ephemeral = 'ephemeral',
}

/**
 * Defines values for ContactRelationUpdateActionTypes.
 * Possible values include: 'add', 'remove'
 *
 * @readonly
 * @enum {string}
 */
export enum ContactRelationUpdateActionTypes {
    Add = 'add',
    Remove = 'remove',
}

/**
 * Defines values for InstallationUpdateActionTypes.
 * Possible values include: 'add', 'remove'
 *
 * @readonly
 * @enum {string}
 */
export enum InstallationUpdateActionTypes {
    Add = 'add',
    Remove = 'remove',
}

/**
 * Defines values for SemanticActionStateTypes.
 * Possible values include: 'start', 'continue', 'done'
 *
 * @readonly
 * @enum {string}
 */
export enum SemanticActionStateTypes {
    Start = 'start',
    Continue = 'continue',
    Done = 'done',
}

/**
 * Defines values for ChannelIds for Channels.
 * Possible values include: 'alexa', 'console', 'cortana', 'directline', 'directlinespeech', 'email',
 * 'emulator', 'facebook', 'groupme', 'kik', 'line', 'msteams', 'onmichannel', 'outlook', 'skype', 'skypeforbusiness',
 * 'slack', 'sms', 'telegram', 'test', 'twilio-sms', 'webchat'
 *
 * @readonly
 * @enum {string}
 */
export enum Channels {
    Alexa = 'alexa',
    Console = 'console',
    Directline = 'directline',
    DirectlineSpeech = 'directlinespeech',
    Email = 'email',
    Emulator = 'emulator',
    Facebook = 'facebook',
    Groupme = 'groupme',
    /**
     * @deprecated This channel is no longer available for bot developers.
     */
    Kik = 'kik',
    Line = 'line',
    Msteams = 'msteams',
    Omni = 'omnichannel',
    Outlook = 'outlook',
    Skype = 'skype',
    /**
     * @deprecated This channel is no longer available for bot developers.
     */
    Skypeforbusiness = 'skypeforbusiness',
    Slack = 'slack',
    Sms = 'sms',
    Telegram = 'telegram',
    Telephony = 'telephony',
    Test = 'test',
    /**
     * @deprecated This channel is no longer available for bot developers.
     */
    Twilio = 'twilio-sms',
    Webchat = 'webchat',
}

/**
 * Defines values for StatusCodes.
 * Possible values include: 200, 400, 401, 404, 405, 409, 426, 500, 501, 502
 *
 * @readonly
 * @enum {number}
 */
export enum StatusCodes {
    OK = 200,
    CREATED = 201,
    MULTIPLE_CHOICES = 300,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    PRECONDITION_FAILED = 412,
    UPGRADE_REQUIRED = 426,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
}

export interface IStatusCodeError {
    statusCode: StatusCodes;
    message?: string;
}

/**
 * Defines the structure that arrives in the Activity.Value.Authentication for Invoke
 * activity with Name of 'adaptiveCard/action'.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AdaptiveCardAuthentication extends TokenExchangeInvokeRequest {
    // No-op. This interface was accidentally created as a duplicate of TokenExchangeInvokeRequest but must remain for backwards-compatibility.
}

/**
 * Defines the structure that arrives in the Activity.Value.Action for Invoke
 * activity with Name of 'adaptiveCard/action'.
 */
export interface AdaptiveCardInvokeAction {
    /**
     * The Type of this Adaptive Card Invoke Action.
     */
    type: string;
    /**
     * The id of this Adaptive Card Invoke Action.
     */
    id: string;
    /**
     * The Verb of this adaptive card action invoke.
     */
    verb: string;
    /**
     * The Data of this adaptive card action invoke.
     */
    data: Record<string, unknown>;
}

/**
 * Defines the structure that is returned as the result of an Invoke activity with
 * Name of 'adaptiveCard/action'.
 */
export interface AdaptiveCardInvokeResponse {
    /**
     * The Card Action response status code.
     */
    statusCode: number;
    /**
     * The type of this response.
     */
    type: string;
    /**
     * The json response object.
     */
    value: Record<string, unknown>;
}

/**
 * Defines the structure that arrives in the Activity.Value for Invoke activity with
 * Name of 'adaptiveCard/action'.
 */
export interface AdaptiveCardInvokeValue {
    /**
     * The [AdaptiveCardInvokeAction](xref:botframework-schema.AdaptiveCardInvokeAction) of
     * this adaptive card invoke action value.
     */
    action: AdaptiveCardInvokeAction;
    /**
     * The [AdaptiveCardAuthentication](xref:botframework-schema.AdaptiveCardAuthentication)
     * for this adaptive card invoke action value.
     */
    authentication: AdaptiveCardAuthentication;
    /**
     * The 'state' or magic code for an OAuth flow.
     */
    state: string;
}

/**
 * Defines the structure that arrives in the Activity.Value for Invoke activity with
 * Name of 'application/search'.
 */
export interface SearchInvokeValue {
    /**
     * The kind of the search invoke value.
     * Must be either search, searchAnswer or typeAhead.
     */
    kind: string;
    /**
     * The query text for the search invoke value.
     */
    queryText: string;
    /**
     * The [SearchInvokeOptions](xref:botframework-schema.SearchInvokeOptions)
     * for this search invoke value.
     */
    queryOptions: SearchInvokeOptions;
    /**
     * The the context information about the query. Such as the UI control that issued the query.
     * The type of the context field is object and is dependent on the kind field.
     * For search and searchAnswers, there is no defined context value.
     */
    context: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Provides information about the options desired for a [SearchInvokeValue](xref:botframework-schema.SearchInvokeValue)
 */
export interface SearchInvokeOptions {
    /**
     * Indicates starting reference number from which ordered search results should be returned.
     */
    skip: number;
    /**
     * Indicates the number of search results that should be returned.
     */
    top: number;
}

/**
 * Defines the structure that is returned as the result of an Invoke activity with
 * Name of 'application/search'.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SearchInvokeResponse extends AdaptiveCardInvokeResponse {}

/**
 * Represents a response returned by a bot when it receives an `invoke` activity.
 *
 * This interface supports the framework and is not intended to be called directly for your code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface InvokeResponse<T = any> {
    /**
     * The HTTP status code of the response.
     */
    status: number;

    /**
     * Optional. The body of the response.
     */
    body?: T;
}

/**
 * State object passed to the bot token service.
 */
export type TokenExchangeState = {
    /**
     * The connection name that was used.
     */
    connectionName: string;

    /**
     * A reference to the conversation.
     */
    conversation: ConversationReference;

    /**
     * A reference to a related parent conversation conversation.
     */
    relatesTo: ConversationReference;

    /**
     * The URL of the bot messaging endpoint.
     */
    msAppId: string;
};

/**
 * The status of a particular token.
 */
export type TokenStatus = {
    /**
     * The channel ID.
     */
    channelId: string;

    /**
     * The connection name.
     */
    connectionName: string;

    /**
     * Boolean indicating if a token is stored for this ConnectionName.
     */
    hasToken: boolean;

    /**
     * The display name of the service provider for which this Token belongs to.
     */
    serviceProviderDisplayName: string;
};
