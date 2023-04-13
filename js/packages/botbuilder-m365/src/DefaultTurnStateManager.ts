/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// TODO:
/* eslint-disable security/detect-object-injection */
import { TurnContext, Storage, StoreItems } from 'botbuilder';
import { TurnState, TurnStateEntry, TurnStateManager } from './TurnState';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultConversationState {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultUserState {}

export interface DefaultTempState {
    /**
     * Input passed to an AI prompt
     */
    input: string;

    /**
     * Formatted conversation history for embedding in an AI prompt
     */
    history: string;

    /**
     * Output returned from an AI prompt or function
     */
    output: string;
}
/**
 * Types of Turn State held in MemoryStorage
 *
 * @module botbuilder-m365
 */
export interface DefaultTurnState<
    TConversationState extends DefaultConversationState = DefaultConversationState,
    TUserState extends DefaultUserState = DefaultUserState,
    TTempState extends DefaultTempState = DefaultTempState
> extends TurnState {
    conversation: TurnStateEntry<TConversationState>;
    user: TurnStateEntry<TUserState>;
    temp: TurnStateEntry<TTempState>;
}

export class DefaultTurnStateManager<
    TConversationState extends DefaultConversationState = DefaultConversationState,
    TUserState extends DefaultUserState = DefaultUserState,
    TTempState extends DefaultTempState = DefaultTempState
> implements TurnStateManager<DefaultTurnState<TConversationState, TUserState, TTempState>>
{
    public async loadState(
        storage: Storage,
        context: TurnContext
    ): Promise<DefaultTurnState<TConversationState, TUserState, TTempState>> {
        // Compute state keys
        const activity = context.activity;
        const channelId = activity?.channelId;
        const botId = activity?.recipient?.id;
        const conversationId = activity?.conversation?.id;
        const userId = activity?.from?.id;

        if (!channelId) {
            throw new Error('missing context.activity.channelId');
        }

        if (!botId) {
            throw new Error('missing context.activity.recipient.id');
        }

        if (!conversationId) {
            throw new Error('missing context.activity.conversation.id');
        }

        if (!userId) {
            throw new Error('missing context.activity.from.id');
        }

        const conversationKey = `${channelId}/${botId}/conversations/${conversationId}`;
        const userKey = `${channelId}/${botId}/users/${userId}`;

        // Read items from storage provider (if configured)
        const items = storage ? await storage.read([conversationKey, userKey]) : {};

        // Map items to state object
        const state: DefaultTurnState<TConversationState, TUserState, TTempState> = {
            conversation: new TurnStateEntry(items[conversationKey], conversationKey),
            user: new TurnStateEntry(items[userKey], userKey),
            temp: new TurnStateEntry({} as TTempState)
        };

        return state;
    }

    public async saveState(
        storage: Storage,
        context: TurnContext,
        state: DefaultTurnState<TConversationState, TUserState, TTempState>
    ): Promise<void> {
        // Find changes and deletions
        let changes: StoreItems | undefined;
        let deletions: string[] | undefined;
        for (const key in state) {
            if (Object.prototype.hasOwnProperty.call(state, key)) {
                const entry = state[key];
                if (entry.storageKey) {
                    if (entry.isDeleted) {
                        // Add to deletion list
                        if (deletions) {
                            deletions.push(entry.storageKey);
                        } else {
                            deletions = [entry.storageKey];
                        }
                    } else if (entry.hasChanged) {
                        // Add to change set
                        if (!changes) {
                            changes = {};
                        }

                        changes[entry.storageKey] = entry.value;
                    }
                }
            }
        }

        // Do we have a storage provider?
        if (storage) {
            // Apply changes
            const promises: Promise<void>[] = [];
            if (changes) {
                promises.push(storage.write(changes));
            }

            // Apply deletions
            if (deletions) {
                promises.push(storage.delete(deletions));
            }

            // Wait for completion
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        }
    }
}
