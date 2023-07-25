// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Defines names of common properties for use with a [BotTelemetryClient](xref:botbuilder-core.BotTelemetryClient) object.
 */
export class TelemetryConstants {
    /**
     * The telemetry property value for channel id.
     */
    static readonly channelIdProperty: string = 'channelId';

    /**
     * The telemetry property value for conversation id.
     */
    static readonly conversationIdProperty: string = 'conversationId';

    /**
     * The telemetry property value for conversation name.
     */
    static readonly conversationNameProperty: string = 'conversationName';

    /**
     * The telemetry property value for dialog id.
     */
    static readonly dialogIdProperty: string = 'dialogId';

    /**
     * The telemetry property value for from id.
     */
    static readonly fromIdProperty: string = 'fromId';

    /**
     * The telemetry property value for from name.
     */
    static readonly fromNameProperty: string = 'fromName';

    /**
     * The telemetry property value for locale.
     */
    static readonly localeProperty: string = 'locale';

    /**
     * The telemetry property value for recipient id.
     */
    static readonly recipientIdProperty: string = 'recipientId';

    /**
     * The telemetry property value for recipient name.
     */
    static readonly recipientNameProperty: string = 'recipientName';

    /**
     * The telemetry property value for reply activity id.
     */
    static readonly replyActivityIdProperty: string = 'replyActivityId';

    /**
     * The telemetry property value for text.
     */
    static readonly textProperty: string = 'text';

    /**
     * The telemetry property value for speak.
     */
    static readonly speakProperty: string = 'speak';

    /**
     * The telemetry property value for user id.
     */
    static readonly userIdProperty: string = 'userId';

    /**
     * The telemetry property value for attachments.
     */
    static readonly attachmentsProperty: string = 'attachments';

    /**
     * The telemetry property value for activity type.
     */
    static readonly activityTypeProperty: string = 'type';
}
