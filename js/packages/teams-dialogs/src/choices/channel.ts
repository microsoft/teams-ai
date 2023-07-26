/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Channels, TurnContext } from '@microsoft/teams-core';

/**
 * @private
 * @param channelId the id of a channel
 * @param buttonCnt count of buttons allowed
 */
export function supportsSuggestedActions(channelId: string, buttonCnt = 100): boolean {
    switch (channelId) {
        case Channels.Facebook:
        case Channels.Skype:
            return buttonCnt <= 10;
        case Channels.Line:
            return buttonCnt <= 13;
        case Channels.Kik:
            return buttonCnt <= 20;
        case Channels.Telegram:
        case Channels.Emulator:
        case Channels.Directline:
        case Channels.Webchat:
        case Channels.DirectlineSpeech:
            return buttonCnt <= 100;
        default:
            return false;
    }
}

/**
 * @private
 * @param channelId the id of a channel
 * @param buttonCnt count of buttons allowed
 */
export function supportsCardActions(channelId: string, buttonCnt = 100): boolean {
    switch (channelId) {
        case Channels.Facebook:
        case Channels.Skype:
            return buttonCnt <= 3;
        case Channels.Msteams:
            return buttonCnt <= 50;
        case Channels.Line:
            return buttonCnt <= 99;
        case Channels.Slack:
        case Channels.Telegram:
        case Channels.Emulator:
        case Channels.Directline:
        case Channels.DirectlineSpeech:
        case Channels.Webchat:
            return buttonCnt <= 100;
        default:
            return false;
    }
}

/**
 * @private
 * @param _channelId id of a channel
 */
export function hasMessageFeed(_channelId: string): boolean {
    // The removed 'cortana' channel was the only channel that returned false.
    // This channel is no longer available for bot developers and was removed from
    // the Channels enum while addressing issue #3603.
    // Though it's marked as private in the docstring, the contents of channel.ts
    // are publically available but not documented in the official reference docs.
    // Thus, the method is retained.
    return true;
}

/**
 * @private
 * @param _channelId id of a channel
 */
export function maxActionTitleLength(_channelId: string): number {
    return 20;
}

/**
 * @private
 * @param context a TurnContext object representing an incoming message
 */
export function getChannelId(context: TurnContext): string {
    return context.activity.channelId || '';
}
