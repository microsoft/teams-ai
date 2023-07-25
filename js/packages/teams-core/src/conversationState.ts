/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity } from '@microsoft/teams-connector/src/schema';
import { BotState } from './botState';
import { Storage } from './storage';
import { TurnContext } from './turnContext';

const NO_KEY = 'ConversationState: overridden getStorageKey method did not return a key.';

/**
 * Reads and writes conversation state for your bot to storage.
 *
 * @remarks
 * Each conversation your bot has with a user or group will have its own isolated storage object
 * that can be used to persist conversation tracking information between turns of the conversation.
 * This state information can be reset at any point by calling [clear()](#clear).
 *
 * ```JavaScript
 * const { ConversationState, MemoryStorage } = require('botbuilder');
 *
 * const conversationState = new ConversationState(new MemoryStorage());
 * ```
 */
export class ConversationState extends BotState {
    /**
     * Creates a new ConversationState instance.
     *
     * @param storage Storage provider to persist conversation state to.
     * @param namespace (Optional) namespace to append to storage keys. Defaults to an empty string.
     */
    constructor(storage: Storage, private namespace: string = '') {
        super(storage, (context: TurnContext) => {
            // Calculate storage key
            const key: string|undefined = this.getStorageKey(context);

            return key ? Promise.resolve(key) : Promise.reject(new Error(NO_KEY));
        });
    }

    /**
     * Returns the storage key for the current conversation state.
     *
     * @param context Context for current turn of conversation with the user.
     * @returns The storage key for the current conversation state.
     */
    getStorageKey(context: TurnContext): string | undefined {
        const activity: Activity = context.activity;
        const channelId: string = activity.channelId;
        const conversationId: string|undefined =
            activity != undefined && activity.conversation != undefined && activity.conversation.id ? activity.conversation.id : undefined;

        if (!channelId) {
            throw new Error('missing activity.channelId');
        }

        if (!conversationId) {
            throw new Error('missing activity.conversation.id');
        }

        return `${channelId}/conversations/${conversationId}/${this.namespace}`;
    }
}
