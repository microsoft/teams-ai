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

const NO_KEY = 'PrivateConversationState: overridden getStorageKey method did not return a key.';

/**
 * Reads and writes PrivateConversation state for your bot to storage.
 *
 * @remarks
 * Each PrivateConversation your bot has with a user or group will have its own isolated storage object
 * that can be used to persist PrivateConversation tracking information between turns of the PrivateConversation.
 * This state information can be reset at any point by calling [clear()](#clear).
 *
 * ```JavaScript
 * const { PrivateConversationState, MemoryStorage } = require('botbuilder');
 *
 * const PrivateConversationState = new PrivateConversationState(new MemoryStorage());
 * ```
 */
export class PrivateConversationState extends BotState {
    /**
     * Creates a new PrivateConversationState instance.
     *
     * @param storage Storage provider to persist PrivateConversation state to.
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
     * Returns the storage key for the current PrivateConversation state.
     *
     * @param context Context for current turn of PrivateConversation with the user.
     * @returns The storage key for the current PrivateConversation state.
     */
    getStorageKey(context: TurnContext): string | undefined {
        const activity: Activity = context.activity;
        const channelId: string = activity.channelId;
        const conversationId: string|undefined =
            activity && activity.conversation && activity.conversation.id ? activity.conversation.id : undefined;
        const userId: string|undefined = activity && activity.from && activity.from.id ? activity.from.id : undefined;

        if (!channelId) {
            throw new Error('missing activity.channelId');
        }

        if (!conversationId) {
            throw new Error('missing activity.conversation.id');
        }

        if (!userId) {
            throw new Error('missing activity.from.id');
        }

        return `${channelId}/conversations/${conversationId}/users/${userId}/${this.namespace}`;
    }
}
