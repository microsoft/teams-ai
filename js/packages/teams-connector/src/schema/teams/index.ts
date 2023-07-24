/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// The Teams schemas was manually added to botframework-schema. This file has been updated import from the botframework-schema and the extension folder.
// The ChannelCount and MemberCount fields were manually added to the TeamDetails definition.
import { MessageActionsPayloadBody, O365ConnectorCardActionBase, O365ConnectorCardInputBase } from './extension';
import { Activity, Attachment, CardAction, ChannelAccount, ConversationAccount } from '../';
export * from './extension';

/**
 * @interface
 * An interface representing ChannelInfo.
 * A channel info object which decribes the channel.
 *
 */
export interface ChannelInfo {
    /**
     * @member {string} [id] Unique identifier representing a channel
     */
    id?: string;
    /**
     * @member {string} [name] Name of the channel
     */
    name?: string;
    /**
     * @member {string} [type] The type of the channel. Valid values are standard, shared and private.
     */
    type?: string;
}

/**
 * @interface
 * An interface representing ConversationList.
 * List of channels under a team
 *
 */
export interface ConversationList {
    /**
     * @member {ChannelInfo[]} [conversations]
     */
    conversations?: ChannelInfo[];
}

/**
 * @interface
 * An interface representing TeamDetails.
 * Details related to a team
 *
 */
export interface TeamDetails {
    /**
     * @member {string} [id] Unique identifier representing a team
     */
    id?: string;
    /**
     * @member {string} [name] Name of team.
     */
    name?: string;
    /**
     * @member {string} [aadGroupId] Azure Active Directory (AAD) Group Id for
     * the team.
     */
    aadGroupId?: string;
    /**
     * @member {number} [channelCount] Count of channels in the team.
     */
    channelCount?: number;
    /**
     * @member {number} [memberCount] Count of members in the team.
     * the team.
     */
    memberCount?: number;
    /**
     * @member {string} [type] The type of the team. Valid values are standard, sharedChannel and privateChannel.
     */
    type?: string;
}

/**
 * @interface
 * An interface representing TeamInfo.
 * Describes a team
 *
 */
export interface TeamInfo {
    /**
     * @member {string} [id] Unique identifier representing a team
     */
    id?: string;
    /**
     * @member {string} [name] Name of team.
     */
    name?: string;
    /**
     * @member {string} [aadGroupId] The Azure AD Teams group ID.
     */
    aadGroupId?: string;
}

/**
 * @interface
 * An interface representing NotificationInfo.
 * Specifies if a notification is to be sent for the mentions.
 *
 */
export interface NotificationInfo {
    /**
     * @member {boolean} [alert] true if notification is to be sent to the user,
     * false otherwise.
     */
    alert?: boolean;
    /**
     * @member {boolean} [alertInMeeting] true if a notification is to be shown to the user while in a meeting,
     * false otherwise.
     */
    alertInMeeting?: boolean;
    /**
     * @member {string} [externalResourceUrl] the value of the notification's external resource url
     */
    externalResourceUrl?: string;
}

/**
 * @interface
 * An interface representing TenantInfo.
 * Describes a tenant
 *
 */
export interface TenantInfo {
    /**
     * @member {string} [id] Unique identifier representing a tenant
     */
    id?: string;
}

/**
 * @interface
 * An interface representing TeamsMeetingInfo.
 * Describes a meeting
 *
 */
export interface TeamsMeetingInfo {
    /**
     * @member {string} [id] Unique identifier representing a meeting
     */
    id?: string;
}

/**
 * @interface
 * An interface representing TeamsChannelData.
 * Channel data specific to messages received in Microsoft Teams
 *
 */
export interface TeamsChannelData {
    /**
     * @member {ChannelInfo} [channel] Information about the channel in which the
     * message was sent.
     */
    channel?: ChannelInfo;
    /**
     * @member {string} [eventType] Type of event.
     */
    eventType?: string;
    /**
     * @member {TeamInfo} [team] Information about the team in which the message
     * was sent.
     */
    team?: TeamInfo;
    /**
     * @member {NotificationInfo} [notification] Notification settings for the
     * message.
     */
    notification?: NotificationInfo;
    /**
     * @member {TenantInfo} [tenant] Information about the tenant in which the
     * message was sent.
     */
    tenant?: TenantInfo;
    /**
     * @member {TeamsMeetingInfo} [meeting] Information about the tenant in which the
     * message was sent.
     */
    meeting?: TeamsMeetingInfo;
    /**
     * @member {TeamsChannelDataSettings} [settings] Information about the settings in which the
     * message was sent.
     */
    settings?: TeamsChannelDataSettings;
}

/**
 * @interface
 * An interface representing TeamsChannelAccount.
 * Teams channel account detailing user Azure Active Directory details.
 *
 * @extends ChannelAccount
 */
export interface TeamsChannelAccount extends ChannelAccount {
    /**
     * @member {string} [givenName] Given name part of the user name.
     */
    givenName?: string;
    /**
     * @member {string} [surname] Surname part of the user name.
     */
    surname?: string;
    /**
     * @member {string} [email] Email Id of the user.
     */
    email?: string;
    /**
     * @member {string} [userPrincipalName] Unique user principal name.
     */
    userPrincipalName?: string;
    /**
     * @member {string} [tenantId] Tenant Id of the user.
     */
    tenantId?: string;
    /**
     * @member {string} [userRole] User Role of the user.
     */
    userRole?: string;
}

/**
 * @interface
 * Settings within teams channel data specific to messages received in Microsoft Teams.
 */
export interface TeamsChannelDataSettings {
    /**
     * @member {ChannelInfo} [selectedChannel] Information about the selected Teams channel.
     */
    selectedChannel?: ChannelInfo;
    /**
     * @member {any} [any] Additional properties that are not otherwise defined by the TeamsChannelDataSettings
     * type but that might appear in the REST JSON object.
     * @remarks With this, properties not represented in the defined type are not dropped when
     * the JSON object is deserialized, but are instead stored in this property. Such properties
     * will be written to a JSON object when the instance is serialized.
     */
    [properties: string]: unknown;
}

/**
 * @interface
 * An interface representing a Meeting.
 * Meeting details.
 */
export interface Meeting {
    /**
     * @member {string} [role] Meeting role of the user.
     */
    role?: string;
    /**
     * @member {string} [inMeeting] Indicates if the participant is in the meeting.
     */
    inMeeting?: boolean;
}

/**
 * @interface
 * An interface representing TeamsMeetingParticipant.
 * Teams meeting participant detailing user Azure Active Directory details.
 *
 */
export interface TeamsMeetingParticipant {
    /**
     * @member {TeamsChannelAccount} [user] The user details
     */
    user?: TeamsChannelAccount;
    /**
     * @member {Meeting} [meeting] The meeting details.
     */
    meeting?: Meeting;
    /**
     * @member {ConversationAccount} [conversation] The conversation account for the meeting.
     */
    conversation?: ConversationAccount;
}

export interface TeamsPagedMembersResult {
    /**
     * Paging token
     */
    continuationToken: string;
    /**
     * The Channel Accounts.
     */
    members: TeamsChannelAccount[];
}

/**
 * @interface
 * An interface representing O365ConnectorCardFact.
 * O365 connector card fact
 *
 */
export interface O365ConnectorCardFact {
    /**
     * @member {string} [name] Display name of the fact
     */
    name?: string;
    /**
     * @member {string} [value] Display value for the fact
     */
    value?: string;
}

/**
 * @interface
 * An interface representing O365ConnectorCardImage.
 * O365 connector card image
 *
 */
export interface O365ConnectorCardImage {
    /**
     * @member {string} [image] URL for the image
     */
    image?: string;
    /**
     * @member {string} [title] Alternative text for the image
     */
    title?: string;
}

/**
 * @interface
 * An interface representing O365ConnectorCardSection.
 * O365 connector card section
 *
 */
export interface O365ConnectorCardSection {
    /**
     * @member {string} [title] Title of the section
     */
    title?: string;
    /**
     * @member {string} [text] Text for the section
     */
    text?: string;
    /**
     * @member {string} [activityTitle] Activity title
     */
    activityTitle?: string;
    /**
     * @member {string} [activitySubtitle] Activity subtitle
     */
    activitySubtitle?: string;
    /**
     * @member {string} [activityText] Activity text
     */
    activityText?: string;
    /**
     * @member {string} [activityImage] Activity image
     */
    activityImage?: string;
    /**
     * @member {ActivityImageType} [activityImageType] Describes how Activity
     * image is rendered. Possible values include: 'avatar', 'article'
     */
    activityImageType?: ActivityImageType;
    /**
     * @member {boolean} [markdown] Use markdown for all text contents. Default
     * vaule is true.
     */
    markdown?: boolean;
    /**
     * @member {O365ConnectorCardFact[]} [facts] Set of facts for the current
     * section
     */
    facts?: O365ConnectorCardFact[];
    /**
     * @member {O365ConnectorCardImage[]} [images] Set of images for the current
     * section
     */
    images?: O365ConnectorCardImage[];
    /**
     * @member {O365ConnectorCardActionBase[]} [potentialAction] Set of actions
     * for the current section
     */
    potentialAction?: O365ConnectorCardActionBase[];
}

/**
 * @interface
 * An interface representing O365ConnectorCard.
 * O365 connector card
 *
 */
export interface O365ConnectorCard {
    /**
     * @member {string} [title] Title of the item
     */
    title?: string;
    /**
     * @member {string} [text] Text for the card
     */
    text?: string;
    /**
     * @member {string} [summary] Summary for the card
     */
    summary?: string;
    /**
     * @member {string} [themeColor] Theme color for the card
     */
    themeColor?: string;
    /**
     * @member {O365ConnectorCardSection[]} [sections] Set of sections for the
     * current card
     */
    sections?: O365ConnectorCardSection[];
    /**
     * @member {O365ConnectorCardActionBase[]} [potentialAction] Set of actions
     * for the current card
     */
    potentialAction?: O365ConnectorCardActionBase[];
}

/**
 * @interface
 * An interface representing O365ConnectorCardViewAction.
 * O365 connector card ViewAction action
 *
 * @extends O365ConnectorCardActionBase
 */
export interface O365ConnectorCardViewAction extends O365ConnectorCardActionBase {
    /**
     * @member {string[]} [target] Target urls, only the first url effective for
     * card button
     */
    target?: string[];
}

/**
 * @interface
 * An interface representing O365ConnectorCardOpenUriTarget.
 * O365 connector card OpenUri target
 *
 */
export interface O365ConnectorCardOpenUriTarget {
    /**
     * @member {Os} [os] Target operating system. Possible values include:
     * 'default', 'iOS', 'android', 'windows'
     */
    os?: Os;
    /**
     * @member {string} [uri] Target url
     */
    uri?: string;
}

/**
 * @interface
 * An interface representing O365ConnectorCardOpenUri.
 * O365 connector card OpenUri action
 *
 * @extends O365ConnectorCardActionBase
 */
export interface O365ConnectorCardOpenUri extends O365ConnectorCardActionBase {
    /**
     * @member {O365ConnectorCardOpenUriTarget[]} [targets] Target os / urls
     */
    targets?: O365ConnectorCardOpenUriTarget[];
}

/**
 * @interface
 * An interface representing O365ConnectorCardHttpPOST.
 * O365 connector card HttpPOST action
 *
 * @extends O365ConnectorCardActionBase
 */
export interface O365ConnectorCardHttpPOST extends O365ConnectorCardActionBase {
    /**
     * @member {string} [body] Content to be posted back to bots via invoke
     */
    body?: string;
}

/**
 * @interface
 * An interface representing O365ConnectorCardActionCard.
 * O365 connector card ActionCard action
 *
 * @extends O365ConnectorCardActionBase
 */
export interface O365ConnectorCardActionCard extends O365ConnectorCardActionBase {
    /**
     * @member {O365ConnectorCardInputBase[]} [inputs] Set of inputs contained in
     * this ActionCard whose each item can be in any subtype of
     * O365ConnectorCardInputBase
     */
    inputs?: O365ConnectorCardInputBase[];
    /**
     * @member {O365ConnectorCardActionBase[]} [actions] Set of actions contained
     * in this ActionCard whose each item can be in any subtype of
     * O365ConnectorCardActionBase except O365ConnectorCardActionCard, as nested
     * ActionCard is forbidden.
     */
    actions?: O365ConnectorCardActionBase[];
}

/**
 * @interface
 * An interface representing O365ConnectorCardTextInput.
 * O365 connector card text input
 *
 * @extends O365ConnectorCardInputBase
 */
export interface O365ConnectorCardTextInput extends O365ConnectorCardInputBase {
    /**
     * @member {boolean} [isMultiline] Define if text input is allowed for
     * multiple lines. Default value is false.
     */
    isMultiline?: boolean;
    /**
     * @member {number} [maxLength] Maximum length of text input. Default value
     * is unlimited.
     */
    maxLength?: number;
}

/**
 * @interface
 * An interface representing O365ConnectorCardDateInput.
 * O365 connector card date input
 *
 * @extends O365ConnectorCardInputBase
 */
export interface O365ConnectorCardDateInput extends O365ConnectorCardInputBase {
    /**
     * @member {boolean} [includeTime] Include time input field. Default value
     * is false (date only).
     */
    includeTime?: boolean;
}

/**
 * @interface
 * An interface representing O365ConnectorCardMultichoiceInputChoice.
 * O365O365 connector card multiple choice input item
 *
 */
export interface O365ConnectorCardMultichoiceInputChoice {
    /**
     * @member {string} [display] The text rednered on ActionCard.
     */
    display?: string;
    /**
     * @member {string} [value] The value received as results.
     */
    value?: string;
}

/**
 * @interface
 * An interface representing O365ConnectorCardMultichoiceInput.
 * O365 connector card multiple choice input
 *
 * @extends O365ConnectorCardInputBase
 */
export interface O365ConnectorCardMultichoiceInput extends O365ConnectorCardInputBase {
    /**
     * @member {O365ConnectorCardMultichoiceInputChoice[]} [choices] Set of
     * choices whose each item can be in any subtype of
     * O365ConnectorCardMultichoiceInputChoice.
     */
    choices?: O365ConnectorCardMultichoiceInputChoice[];
    /**
     * @member {Style} [style] Choice item rendering style. Default valud is
     * 'compact'. Possible values include: 'compact', 'expanded'
     */
    style?: Style;
    /**
     * @member {boolean} [isMultiSelect] Define if this input field allows
     * multiple selections. Default value is false.
     */
    isMultiSelect?: boolean;
}

/**
 * @interface
 * An interface representing O365ConnectorCardActionQuery.
 * O365 connector card HttpPOST invoke query
 *
 */
export interface O365ConnectorCardActionQuery {
    /**
     * @member {string} [body] The results of body string defined in
     * IO365ConnectorCardHttpPOST with substituted input values
     */
    body?: string;
    /**
     * @member {string} [actionId] Action Id associated with the HttpPOST action
     * button triggered, defined in O365ConnectorCardActionBase.
     */
    actionId?: string;
}

/**
 * @interface
 * An interface representing SigninStateVerificationQuery.
 * Signin state (part of signin action auth flow) verification invoke query
 *
 */
export interface SigninStateVerificationQuery {
    /**
     * @member {string} [state] The state string originally received when the
     * signin web flow is finished with a state posted back to client via tab SDK
     * microsoftTeams.authentication.notifySuccess(state)
     */
    state?: string;
}

/**
 * @interface
 * An interface representing MessagingExtensionQueryOptions.
 * Messaging extension query options
 *
 */
export interface MessagingExtensionQueryOptions {
    /**
     * @member {number} [skip] Number of entities to skip
     */
    skip?: number;
    /**
     * @member {number} [count] Number of entities to fetch
     */
    count?: number;
}

/**
 * @interface
 * An interface representing MessagingExtensionParameter.
 * Messaging extension query parameters
 *
 */
export interface MessagingExtensionParameter {
    /**
     * @member {string} [name] Name of the parameter
     */
    name?: string;
    /**
     * @member {any} [value] Value of the parameter
     */
    value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @interface
 * An interface representing MessagingExtensionQuery.
 * Messaging extension query
 *
 */
export interface MessagingExtensionQuery {
    /**
     * @member {string} [commandId] Id of the command assigned by Bot
     */
    commandId?: string;
    /**
     * @member {MessagingExtensionParameter[]} [parameters] Parameters for the
     * query
     */
    parameters?: MessagingExtensionParameter[];
    /**
     * @member {MessagingExtensionQueryOptions} [queryOptions]
     */
    queryOptions?: MessagingExtensionQueryOptions;
    /**
     * @member {string} [state] State parameter passed back to the bot after
     * authentication/configuration flow
     */
    state?: string;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadUser.
 * Represents a user entity.
 *
 */
export interface MessageActionsPayloadUser {
    /**
     * @member {UserIdentityType} [userIdentityType] The identity type of the
     * user. Possible values include: 'aadUser', 'onPremiseAadUser',
     * 'anonymousGuest', 'federatedUser'
     */
    userIdentityType?: UserIdentityType;
    /**
     * @member {string} [id] The id of the user.
     */
    id?: string;
    /**
     * @member {string} [displayName] The plaintext display name of the user.
     */
    displayName?: string;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadApp.
 * Represents an application entity.
 *
 */
export interface MessageActionsPayloadApp {
    /**
     * @member {ApplicationIdentityType} [applicationIdentityType] The type of
     * application. Possible values include: 'aadApplication', 'bot',
     * 'tenantBot', 'office365Connector', 'webhook'
     */
    applicationIdentityType?: ApplicationIdentityType;
    /**
     * @member {string} [id] The id of the application.
     */
    id?: string;
    /**
     * @member {string} [displayName] The plaintext display name of the
     * application.
     */
    displayName?: string;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadConversation.
 * Represents a team or channel entity.
 *
 */
export interface MessageActionsPayloadConversation {
    /**
     * @member {ConversationIdentityType} [conversationIdentityType] The type of
     * conversation, whether a team or channel. Possible values include: 'team',
     * 'channel'
     */
    conversationIdentityType?: ConversationIdentityType;
    /**
     * @member {string} [id] The id of the team or channel.
     */
    id?: string;
    /**
     * @member {string} [displayName] The plaintext display name of the team or
     * channel entity.
     */
    displayName?: string;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadFrom.
 * Represents a user, application, or conversation type that either sent or was
 * referenced in a message.
 *
 */
export interface MessageActionsPayloadFrom {
    /**
     * @member {MessageActionsPayloadUser} [user] Represents details of the user.
     */
    user?: MessageActionsPayloadUser;
    /**
     * @member {MessageActionsPayloadApp} [application] Represents details of the
     * app.
     */
    application?: MessageActionsPayloadApp;
    /**
     * @member {MessageActionsPayloadConversation} [conversation] Represents
     * details of the converesation.
     */
    conversation?: MessageActionsPayloadConversation;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadAttachment.
 * Represents the attachment in a message.
 *
 */
export interface MessageActionsPayloadAttachment {
    /**
     * @member {string} [id] The id of the attachment.
     */
    id?: string;
    /**
     * @member {string} [contentType] The type of the attachment.
     */
    contentType?: string;
    /**
     * @member {string} [contentUrl] The url of the attachment, in case of a
     * external link.
     */
    contentUrl?: string;
    /**
     * @member {any} [content] The content of the attachment, in case of a code
     * snippet, email, or file.
     */
    content?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * @member {string} [name] The plaintext display name of the attachment.
     */
    name?: string;
    /**
     * @member {string} [thumbnailUrl] The url of a thumbnail image that might be
     * embedded in the attachment, in case of a card.
     */
    thumbnailUrl?: string;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadMention.
 * Represents the entity that was mentioned in the message.
 *
 */
export interface MessageActionsPayloadMention {
    /**
     * @member {number} [id] The id of the mentioned entity.
     */
    id?: number;
    /**
     * @member {string} [mentionText] The plaintext display name of the mentioned
     * entity.
     */
    mentionText?: string;
    /**
     * @member {MessageActionsPayloadFrom} [mentioned] Provides more details on
     * the mentioned entity.
     */
    mentioned?: MessageActionsPayloadFrom;
}

/**
 * @interface
 * An interface representing MessageActionsPayloadReaction.
 * Represents the reaction of a user to a message.
 *
 */
export interface MessageActionsPayloadReaction {
    /**
     * @member {ReactionType} [reactionType] The type of reaction given to the
     * message. Possible values include: 'like', 'heart', 'laugh', 'surprised',
     * 'sad', 'angry'
     */
    reactionType?: ReactionType;
    /**
     * @member {string} [createdDateTime] Timestamp of when the user reacted to
     * the message.
     */
    createdDateTime?: string;
    /**
     * @member {MessageActionsPayloadFrom} [user] The user with which the
     * reaction is associated.
     */
    user?: MessageActionsPayloadFrom;
}

/**
 * @interface
 * An interface representing MessageActionsPayload.
 * Represents the individual message within a chat or channel where a message
 * actions is taken.
 *
 */
export interface MessageActionsPayload {
    /**
     * @member {string} [id] Unique id of the message.
     */
    id?: string;
    /**
     * @member {string} [replyToId] Id of the parent/root message of the thread.
     */
    replyToId?: string;
    /**
     * @member {MessageType} [messageType] Type of message - automatically set to
     * message. Possible values include: 'message'
     */
    messageType?: MessageType;
    /**
     * @member {string} [createdDateTime] Timestamp of when the message was
     * created.
     */
    createdDateTime?: string;
    /**
     * @member {string} [lastModifiedDateTime] Timestamp of when the message was
     * edited or updated.
     */
    lastModifiedDateTime?: string;
    /**
     * @member {boolean} [deleted] Indicates whether a message has been soft
     * deleted.
     */
    deleted?: boolean;
    /**
     * @member {string} [subject] Subject line of the message.
     */
    subject?: string;
    /**
     * @member {string} [summary] Summary text of the message that could be used
     * for notifications.
     */
    summary?: string;
    /**
     * @member {Importance} [importance] The importance of the message. Possible
     * values include: 'normal', 'high', 'urgent'
     */
    importance?: Importance;
    /**
     * @member {string} [locale] Locale of the message set by the client.
     */
    locale?: string;
    /**
     * @member {string} [linkToMessage] Link back to the message.
     */
    linkToMessage?: string;
    /**
     * @member {MessageActionsPayloadFrom} [from] Sender of the message.
     */
    from?: MessageActionsPayloadFrom;
    /**
     * @member {MessageActionsPayloadBody} [body] Plaintext/HTML representation
     * of the content of the message.
     */
    body?: MessageActionsPayloadBody;
    /**
     * @member {string} [attachmentLayout] How the attachment(s) are displayed in
     * the message.
     */
    attachmentLayout?: string;
    /**
     * @member {MessageActionsPayloadAttachment[]} [attachments] Attachments in
     * the message - card, image, file, etc.
     */
    attachments?: MessageActionsPayloadAttachment[];
    /**
     * @member {MessageActionsPayloadMention[]} [mentions] List of entities
     * mentioned in the message.
     */
    mentions?: MessageActionsPayloadMention[];
    /**
     * @member {MessageActionsPayloadReaction[]} [reactions] Reactions for the
     * message.
     */
    reactions?: MessageActionsPayloadReaction[];
}

/**
 * @interface
 * An interface representing TaskModuleRequest.
 * Task module invoke request value payload
 *
 */
export interface TaskModuleRequest {
    /**
     * @member {any} [data] User input data. Free payload with key-value pairs.
     */
    data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * @member {TaskModuleRequestContext} [context] Current user context, i.e.,
     * the current theme
     */
    context?: TaskModuleRequestContext;
    /**
     * @member {TabEntityContext} [tabContext] Tab request context.
     */
    tabContext?: TabEntityContext;
}

/**
 * @interface
 * An interface representing MessagingExtensionAction.
 * Messaging extension action
 *
 * @extends TaskModuleRequest
 */
export interface MessagingExtensionAction extends TaskModuleRequest {
    /**
     * @member {string} [commandId] Id of the command assigned by Bot
     */
    commandId?: string;
    /**
     * @member {CommandContext} [commandContext] The context from which the
     * command originates. Possible values include: 'message', 'compose',
     * 'commandbox'
     */
    commandContext?: CommandContext;
    /**
     * @member {BotMessagePreviewActionType} [botMessagePreviewAction] Bot message
     * preview action taken by user. Possible values include: 'edit', 'send'
     */
    botMessagePreviewAction?: BotMessagePreviewActionType;
    /**
     * @member {Activity[]} [botActivityPreview]
     */
    botActivityPreview?: Activity[];
    /**
     * @member {MessageActionsPayload} [messagePayload] Message content sent as
     * part of the command request.
     */
    messagePayload?: MessageActionsPayload;
}

/**
 * @interface
 * An interface representing TaskModuleResponseBase.
 * Base class for Task Module responses
 *
 */
export interface TaskModuleResponseBase {
    /**
     * @member {BotMessagePreviewType} [type] Choice of action options when responding to the
     * task/submit message. Possible values include: 'message', 'continue'
     */
    type?: BotMessagePreviewType;
}

/**
 * @interface
 * An interface representing MessagingExtensionAttachment.
 * Messaging extension attachment.
 *
 * @extends Attachment
 */
export interface MessagingExtensionAttachment extends Attachment {
    /**
     * @member {Attachment} [preview]
     */
    preview?: Attachment;
}

/**
 * @interface
 * An interface representing MessagingExtensionSuggestedAction.
 * Messaging extension Actions (Only when type is auth or config)
 *
 */
export interface MessagingExtensionSuggestedAction {
    /**
     * @member {CardAction[]} [actions] Actions
     */
    actions?: CardAction[];
}

/**
 * @interface
 * An interface representing MessagingExtensionResult.
 * Messaging extension result
 *
 */
export interface MessagingExtensionResult {
    /**
     * @member {AttachmentLayout} [attachmentLayout] Hint for how to deal with
     * multiple attachments. Possible values include: 'list', 'grid'
     */
    attachmentLayout?: AttachmentLayout;
    /**
     * @member {MessagingExtensionResultType} [type] The type of the result. Possible values include:
     * 'result', 'auth', 'config', 'message', 'botMessagePreview'
     */
    type?: MessagingExtensionResultType;
    /**
     * @member {MessagingExtensionAttachment[]} [attachments] (Only when type is
     * result) Attachments
     */
    attachments?: MessagingExtensionAttachment[];
    /**
     * @member {MessagingExtensionSuggestedAction} [suggestedActions]
     */
    suggestedActions?: MessagingExtensionSuggestedAction;
    /**
     * @member {string} [text] (Only when type is message) Text
     */
    text?: string;
    /**
     * @member {Activity} [activityPreview] (Only when type is botMessagePreview)
     * Message activity to preview
     */
    activityPreview?: Activity;
}

/**
 * @interface
 * A cache info object which notifies Teams how long an object should be cached for.
 */
export interface CacheInfo {
    /**
     * @member {string} [cacheType] The type of cache for this object.
     */
    cacheType?: string;
    /**
     * @member {number} [cacheDuration] The time in seconds for which the cached object should remain in the cache
     */
    cacheDuration?: number;
}

/**
 * @interface
 * An interface representing MessagingExtensionActionResponse.
 * Response of messaging extension action
 *
 */
export interface MessagingExtensionActionResponse {
    /**
     * @member {TaskModuleContinueResponse | TaskModuleMessageResponse} [task] The JSON for the response to
     * appear in the task module.
     */
    task?: TaskModuleContinueResponse | TaskModuleMessageResponse;
    /**
     * @member {MessagingExtensionResult} [composeExtension]
     */
    composeExtension?: MessagingExtensionResult;
    /**
     * @member {CacheInfo} [cacheInfo] The cache info for this response
     */
    cacheInfo?: CacheInfo;
}

/**
 * @interface
 * An interface representing MessagingExtensionResponse.
 * Messaging extension response
 *
 */
export interface MessagingExtensionResponse {
    /**
     * @member {MessagingExtensionResult} [composeExtension]
     */
    composeExtension?: MessagingExtensionResult;
    /**
     * @member {CacheInfo} [cacheInfo] The cache info for this response
     */
    cacheInfo?: CacheInfo;
}

/**
 * @interface
 * An interface representing FileConsentCard.
 * File consent card attachment.
 *
 */
export interface FileConsentCard {
    /**
     * @member {string} [description] File description.
     */
    description?: string;
    /**
     * @member {number} [sizeInBytes] Size of the file to be uploaded in Bytes.
     */
    sizeInBytes?: number;
    /**
     * @member {any} [acceptContext] Context sent back to the Bot if user
     * consented to upload. This is free flow schema and is sent back in Value
     * field of Activity.
     */
    acceptContext?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * @member {any} [declineContext] Context sent back to the Bot if user
     * declined. This is free flow schema and is sent back in Value field of
     * Activity.
     */
    declineContext?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @interface
 * An interface representing FileDownloadInfo.
 * File download info attachment.
 *
 */
export interface FileDownloadInfo {
    /**
     * @member {string} [downloadUrl] File download url.
     */
    downloadUrl?: string;
    /**
     * @member {string} [uniqueId] Unique Id for the file.
     */
    uniqueId?: string;
    /**
     * @member {string} [fileType] Type of file.
     */
    fileType?: string;
    /**
     * @member {any} [etag] ETag for the file.
     */
    etag?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @interface
 * An interface representing FileInfoCard.
 * File info card.
 *
 */
export interface FileInfoCard {
    /**
     * @member {string} [uniqueId] Unique Id for the file.
     */
    uniqueId?: string;
    /**
     * @member {string} [fileType] Type of file.
     */
    fileType?: string;
    /**
     * @member {any} [etag] ETag for the file.
     */
    etag?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @interface
 * An interface representing FileUploadInfo.
 * Information about the file to be uploaded.
 *
 */
export interface FileUploadInfo {
    /**
     * @member {string} [name] Name of the file.
     */
    name?: string;
    /**
     * @member {string} [uploadUrl] URL to an upload session that the bot can use
     * to set the file contents.
     */
    uploadUrl?: string;
    /**
     * @member {string} [contentUrl] URL to file.
     */
    contentUrl?: string;
    /**
     * @member {string} [uniqueId] ID that uniquely identifies the file.
     */
    uniqueId?: string;
    /**
     * @member {string} [fileType] Type of the file.
     */
    fileType?: string;
}

/**
 * @interface
 * An interface representing FileConsentCardResponse.
 * Represents the value of the invoke activity sent when the user acts on a
 * file consent card
 *
 */
export interface FileConsentCardResponse {
    /**
     * @member {Action} [action] The action the user took. Possible values
     * include: 'accept', 'decline'
     */
    action?: Action;
    /**
     * @member {any} [context] The context associated with the action.
     */
    context?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * @member {FileUploadInfo} [uploadInfo] If the user accepted the file,
     * contains information about the file to be uploaded.
     */
    uploadInfo?: FileUploadInfo;
}

/**
 * @interface
 * Current tab request context, i.e., the current theme.
 */
export interface TabContext {
    /**
     * @member {theme} [string] The current user's theme.
     */
    theme?: string;
}

/**
 * @interface
 * Current TabRequest entity context, or 'tabEntityId'.
 *
 */
export interface TabEntityContext {
    /**
     * @member {string} [tabEntityId] The entity id of the tab.
     */
    tabEntityId?: string;
}

/**
 * @interface
 * Invoke ('tab/fetch') request value payload.
 *
 */
export interface TabRequest {
    /**
     * @member {TabEntityContext} [tabContext] The current tab entity request context.
     */
    tabContext?: TabEntityContext;
    /**
     * @member {TabContext} [context] The current user context, i.e., the current theme.
     */
    context?: TabContext;
    /**
     * @member {string} [state] The magic code for OAuth flow.
     */
    state?: string;
}

/**
 * @interface
 * Envelope for Card Tab Response Payload.
 *
 */
export interface TabResponse {
    /**
     * @member {TabResponsePayload} [tab] The response to the tab/fetch message.
     */
    tab: TabResponsePayload;
}

/**
 * @interface
 * Envelope for cards for a Tab request.
 *
 */
export interface TabResponseCard {
    /**
     * @member {Record<string, any>} [card] The adaptive card for this card tab response.
     */
    card: Record<string, unknown>;
}

/**
 * @interface
 * Envelope for cards for a TabResponse.
 *
 */
export interface TabResponseCards {
    /**
     * @member {TabResponseCard[]} [cards] Adaptive cards for this card tab response.
     */
    cards: TabResponseCard[];
}

/**
 * @interface
 * Payload for Tab Response.
 *
 */
export interface TabResponsePayload {
    /**
     * @member {'continue' | 'auth' | 'silentAuth'} [type] Choice of action options when responding to the tab/fetch message.
     */
    type?: 'continue' | 'auth' | 'silentAuth';
    /**
     * @member {TabResponseCards} [value] The TabResponseCards to send when responding to
     * tab/fetch activity with type of 'continue'.
     */
    value?: TabResponseCards;
    /**
     * @member {TabSuggestedActions} [suggestedActions] The Suggested Actions for this card tab.
     */
    suggestedActions?: TabSuggestedActions;
}

/**
 * @interface
 * Invoke ('tab/submit') request value payload.
 *
 */
export interface TabSubmit {
    /**
     * @member {TabEntityContext} [tabContext] The current tab's entity request context.
     */
    tabContext?: TabEntityContext;
    /**
     * @member {TabContext} [context] The current user context, i.e., the current theme.
     */
    context?: TabContext;
    /**
     * @member {TabSubmitData} [data] User input. Free payload containing properties of key-value pairs.
     */
    data?: TabSubmitData;
}

/**
 * @interface
 * Invoke ('tab/submit') request value payload data.
 *
 */
export interface TabSubmitData {
    /**
     * @member {string} [type] Should currently be 'tab/submit'.
     */
    type?: string;
    /**
     * @member {any} [any] Additional properties not otherwise defined in TabSubmit.
     */
    [properties: string]: unknown;
}

/**
 * @interface
 * Tab SuggestedActions (Only when type is 'auth' or 'silentAuth').
 *
 */
export interface TabSuggestedActions {
    /**
     * @member {CardAction[]} [actions] Actions to show in the card response.
     */
    actions: CardAction[];
}

/**
 * @interface
 * Tab response to 'task/submit'.
 *
 * @extends TaskModuleResponseBase
 */
export interface TaskModuleCardResponse extends TaskModuleResponseBase {
    /**
     * @member {string} [value] JSON for Adaptive cards to appear in the tab.
     */
    value?: string;
}

/**
 * @interface
 * An interface representing TaskModuleTaskInfo.
 * Metadata for a Task Module.
 *
 */
export interface TaskModuleTaskInfo {
    /**
     * @member {string} [title] Appears below the app name and to the right of
     * the app icon.
     */
    title?: string;
    /**
     * @member {number | 'small' | 'medium' | 'large'} [height] This can be a number, representing the task
     * module's height in pixels, or a string, one of: small, medium, large.
     */
    height?: number | 'small' | 'medium' | 'large';
    /**
     * @member {number | 'small' | 'medium' | 'large'} [width] This can be a number, representing the task module's
     * width in pixels, or a string, one of: small, medium, large.
     */
    width?: number | 'small' | 'medium' | 'large';
    /**
     * @member {string} [url] The URL of what is loaded as an iframe inside the
     * task module. One of url or card is required.
     */
    url?: string;
    /**
     * @member {Attachment} [card] The JSON for the Adaptive card to appear in
     * the task module.
     */
    card?: Attachment;
    /**
     * @member {string} [fallbackUrl] If a client does not support the task
     * module feature, this URL is opened in a browser tab.
     */
    fallbackUrl?: string;
    /**
     * @member {string} [completionBotId] If a client does not support the task
     * module feature, this URL is opened in a browser tab.
     */
    completionBotId?: string;
}

/**
 * @interface
 * An interface representing TaskModuleContinueResponse.
 * Task Module Response with continue action.
 *
 * @extends TaskModuleResponseBase
 */
export interface TaskModuleContinueResponse extends TaskModuleResponseBase {
    /**
     * @member {TaskModuleTaskInfo} [value] The JSON for the Adaptive card to
     * appear in the task module.
     */
    value?: TaskModuleTaskInfo;
}

/**
 * @interface
 * An interface representing TaskModuleMessageResponse.
 * Task Module response with message action.
 *
 * @extends TaskModuleResponseBase
 */
export interface TaskModuleMessageResponse extends TaskModuleResponseBase {
    /**
     * @member {string} [value] Teams will display the value of value in a popup
     * message box.
     */
    value?: string;
}

/**
 * @interface
 * An interface representing TaskModuleResponse.
 * Envelope for Task Module Response.
 *
 */
export interface TaskModuleResponse {
    /**
     * @member {TaskModuleContinueResponse | TaskModuleMessageResponse} [task] The JSON for the response to
     * appear in the task module.
     */
    task?: TaskModuleContinueResponse | TaskModuleMessageResponse;
    /**
     * @member {CacheInfo} [cacheInfo] The cache info for this response
     */
    cacheInfo?: CacheInfo;
}

/**
 * @interface
 * An interface representing TaskModuleRequestContext.
 * Current user context, i.e., the current theme
 *
 */
export interface TaskModuleRequestContext {
    /**
     * @member {string} [theme]
     */
    theme?: string;
}

/**
 * @interface
 * An interface representing AppBasedLinkQuery.
 * Invoke request body type for app-based link query.
 *
 */
export interface AppBasedLinkQuery {
    /**
     * @member {string} [url] Url queried by user
     */
    url?: string;
    /**
     * @member {string} [state] State is the magic code for OAuth Flow
     */
    state?: string;
}

/**
 * Defines values for Type.
 * Possible values include: 'ViewAction', 'OpenUri', 'HttpPOST', 'ActionCard'
 *
 * @readonly
 * @enum {string}
 */
export type Type = 'ViewAction' | 'OpenUri' | 'HttpPOST' | 'ActionCard';

/**
 * Defines values for ActivityImageType.
 * Possible values include: 'avatar', 'article'
 *
 * @readonly
 * @enum {string}
 */
export type ActivityImageType = 'avatar' | 'article';

/**
 * Defines values for Os.
 * Possible values include: 'default', 'iOS', 'android', 'windows'
 *
 * @readonly
 * @enum {string}
 */
export type Os = 'default' | 'iOS' | 'android' | 'windows';

/**
 * Defines values for O365ConnectorCardInputBaseType.
 * Possible values include: 'textInput', 'dateInput', 'multichoiceInput'
 *
 * @readonly
 * @enum {string}
 */
export type O365ConnectorCardInputBaseType = 'textInput' | 'dateInput' | 'multichoiceInput';

/**
 * @deprecated Use O365ConnectorCardInputBaseType instead.
 */
export type Type1 = O365ConnectorCardInputBaseType;

/**
 * Defines values for Style.
 * Possible values include: 'compact', 'expanded'
 *
 * @readonly
 * @enum {string}
 */
export type Style = 'compact' | 'expanded';

/**
 * Defines values for UserIdentityType.
 * Possible values include: 'aadUser', 'onPremiseAadUser', 'anonymousGuest', 'federatedUser'
 *
 * @readonly
 * @enum {string}
 */
export type UserIdentityType = 'aadUser' | 'onPremiseAadUser' | 'anonymousGuest' | 'federatedUser';

/**
 * Defines values for ApplicationIdentityType.
 * Possible values include: 'aadApplication', 'bot', 'tenantBot', 'office365Connector', 'webhook'
 *
 * @readonly
 * @enum {string}
 */
export type ApplicationIdentityType = 'aadApplication' | 'bot' | 'tenantBot' | 'office365Connector' | 'webhook';

/**
 * Defines values for ConversationIdentityType.
 * Possible values include: 'team', 'channel'
 *
 * @readonly
 * @enum {string}
 */
export type ConversationIdentityType = 'team' | 'channel';

/**
 * Defines values for ContentType.
 * Possible values include: 'html', 'text'
 *
 * @readonly
 * @enum {string}
 */
export type ContentType = 'html' | 'text';

/**
 * Defines values for ReactionType.
 * Possible values include: 'like', 'heart', 'laugh', 'surprised', 'sad', 'angry'
 *
 * @readonly
 * @enum {string}
 */
export type ReactionType = 'like' | 'heart' | 'laugh' | 'surprised' | 'sad' | 'angry';

/**
 * Defines values for MessageType.
 * Possible values include: 'message'
 *
 * @readonly
 * @enum {string}
 */
export type MessageType = 'message';

/**
 * Defines values for Importance.
 * Possible values include: 'normal', 'high', 'urgent'
 *
 * @readonly
 * @enum {string}
 */
export type Importance = 'normal' | 'high' | 'urgent';

/**
 * Defines values for CommandContext.
 * Possible values include: 'message', 'compose', 'commandbox'
 *
 * @readonly
 * @enum {string}
 */
export type CommandContext = 'message' | 'compose' | 'commandbox';

/**
 * Defines values for BotMessagePreviewActionType.
 * Possible values include: 'edit', 'send'
 *
 * @readonly
 * @enum {string}
 */
export type BotMessagePreviewActionType = 'edit' | 'send';

/**
 * Defines values for BotMessagePreviewType.
 * Possible values include: 'message', 'continue'
 *
 * @readonly
 * @enum {string}
 */
export type BotMessagePreviewType = 'message' | 'continue';

/**
 * @deprecated Use BotMessagePreviewType
 */
export type Type2 = BotMessagePreviewType;

/**
 * Defines values for AttachmentLayout.
 * Possible values include: 'list', 'grid'
 *
 * @readonly
 * @enum {string}
 */
export type AttachmentLayout = 'list' | 'grid';

/**
 * Defines values for MessagingExtensionResultType.
 * Possible values include: 'result', 'auth', 'config', 'message', 'botMessagePreview', 'silentAuth'.
 *
 * @readonly
 * @enum {string}
 */
export type MessagingExtensionResultType =
    | 'result'
    | 'auth'
    | 'config'
    | 'message'
    | 'botMessagePreview'
    | 'silentAuth';

/**
 * @deprecated Use MessagingExtensionResultType instead
 */
export type Type3 = MessagingExtensionResultType;
/**
 * Defines values for Action.
 * Possible values include: 'accept', 'decline'
 *
 * @readonly
 * @enum {string}
 */
export type Action = 'accept' | 'decline';

/**
 * @interface
 */
interface MeetingDetailsBase {
    /**
     * @member {string} [id] The meeting's Id, encoded as a BASE64 string.
     */
    id: string;
    /**
     * @member {string} [joinUrl] The URL used to join the meeting.
     */
    joinUrl: string;
    /**
     * @member {string} [title] The title of the meeting.
     */
    title: string;
}

/**
 * @interface
 * Specific details of a Teams meeting.
 */
export interface MeetingDetails extends MeetingDetailsBase {
    /**
     * @member {string} [msGraphResourceId] The MsGraphResourceId, used specifically for MS Graph API calls.
     */
    msGraphResourceId: string;
    /**
     * @member {Date} [scheduledStartTime] The meeting's scheduled start time, in UTC.
     */
    scheduledStartTime?: Date;
    /**
     * @member {Date} [scheduledEndTime] The meeting's scheduled end time, in UTC.
     */
    scheduledEndTime?: Date;
    /**
     * @member {string} [type] The meeting's type.
     */
    type: string;
}

/**
 * @interface
 * General information about a Teams meeting.
 */
export interface MeetingInfo {
    /**
     * @member {MeetingDetails} [details] The specific details of a Teams meeting.
     */
    details: MeetingDetails;
    /**
     * @member {ConversationAccount} [conversation] The Conversation Account for the meeting.
     */
    conversation: ConversationAccount;
    /**
     * @member {TeamsChannelAccount} [organizer] The organizer's user information.
     */
    organizer: TeamsChannelAccount;
}

/**
 * @interface
 */
export interface MeetingEventDetails extends MeetingDetailsBase {
    /**
     * @member {string} [meetingType] The meeting's type.
     */
    meetingType: string;
}

/**
 * @interface
 * Specific details of a Teams meeting start event.
 */
export interface MeetingStartEventDetails extends MeetingEventDetails {
    /**
     * @member {Date} [startTime] Timestamp for meeting start, in UTC.
     */
    startTime: Date;
}

/**
 * @interface
 * Specific details of a Teams meeting end event.
 */
export interface MeetingEndEventDetails extends MeetingEventDetails {
    /**
     * @member {Date} [endTime] Timestamp for meeting end, in UTC.
     */
    endTime: Date;
}

/**
 * @interface
 * Specifies details of a Teams meeting send notification payload.
 */
export interface TeamsMeetingNotification {
    /**
     * @member {string} [type] The type of meeting notification.
     */
    type: 'targetedMeetingNotification' | string;
    /**
     * @member {TeamsMeetingNotificationInfo} [type] The specific details of the meeting notification.
     */
    value: TeamsMeetingNotificationInfo;
    /**
     * @member {TeamsMeetingNotificationChannelData} [type] The channel data of the meeting notification.
     */
    channelData: TeamsMeetingNotificationChannelData;
}

/**
 * @interface
 * Specifies recipients and surfaces to target in a Teams meeting notification.
 */
export interface TeamsMeetingNotificationInfo {
    /**
     * @member {string[]} [recipients] The list of recipient meeting MRIs.
     */
    recipients: string[];
    /**
     * @member {TeamsMeetingNotificationSurface[]} [surfaces] The List of notification surface configuration.
     */
    surfaces: TeamsMeetingNotificationSurface[];
}

/**
 * @interface
 * Specifies the surface and content for a Teams meeting notification.
 */
export interface TeamsMeetingNotificationSurface {
    /**
     * @member {string} [surface] The surface type.
     */
    surface: 'meetingStage' | string;
    /**
     * @member {string} [contentType] The content type.
     */
    contentType: 'task' | string;
    /**
     * @member {TaskModuleContinueResponse} [content] The content to display in the meeting notification.
     */
    content: TaskModuleContinueResponse;
}

/**
 * @interface
 * Specifies channel data associated with the Teams meeting notification.
 */
export interface TeamsMeetingNotificationChannelData {
    /**
     * @member {TeamsMeetingOnBehalfOf} [onBehalfOf] The user that the bot is sending the notification on behalfOf, if any.
     */
    onBehalfOf?: TeamsMeetingOnBehalfOf;
}

/**
 * @interface
 * Specifies the Teams user that triggered the Teams meeting notification.
 */
export interface TeamsMeetingOnBehalfOf {
    /**
     * @member {number} [itemid] The id of the item.
     */
    itemid: 0 | number;
    /**
     * @member {string} [mentionType] The mention type of a "person".
     */
    mentionType: 'person' | string;
    /**
     * @member {string} [mri] Ther user MRI of the sender.
     */
    mri: string;
    /**
     * @member {string} [displayName] The  of the person.
     */
    displayName?: string;
}

/**
 * @interface
 * Specifies the recipients for which the Teams meeting notification was not sent.
 */
export interface TeamsMeetingNotificationRecipientFailureInfo {
    /**
     * @member {string} [recipientMri] The targeted recipient's MRI.
     */
    recipientMri: string;
    /**
     * @member {string} [failureReason] The reason for which the meetings notification could not be sent to the recipient.
     */
    failureReason: string;
    /**
     * @member {string} [errorCode] The error code.
     */
    errorCode: string;
}

/**
 * @interface
 * Specifies the list of recipients for which the Teams meeting notification was not sent.
 */
export interface TeamsMeetingNotificationRecipientFailureInfos {
    /**
     * @member {string} [errorCode] The list of recipients that failed to recieve the sent meetings notification.
     */
    recipientsFailureInfo: TeamsMeetingNotificationRecipientFailureInfo[];
}
