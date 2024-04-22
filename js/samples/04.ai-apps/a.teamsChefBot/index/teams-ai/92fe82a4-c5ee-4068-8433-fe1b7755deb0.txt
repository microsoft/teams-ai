/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// TODO:
/* eslint-disable security/detect-object-injection */
import { TurnContext, Storage, StoreItems } from 'botbuilder';
import { TurnState, TurnStateEntry, TurnStateManager } from './TurnState';

/**
 * Default conversation state
 * @summary
 * Inherit a new interface from this base interface to strongly type the applications conversation
 * state.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultConversationState {}

/**
 * Default user state
 * @summary
 * Inherit a new interface from this base interface to strongly type the applications user
 * state.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultUserState {}

/**
 * Default temp state
 * @summary
 * Inherit a new interface from this base interface to strongly type the applications temp
 * state.
 */
export interface DefaultTempState {
    /**
     * Token returned if the Application was configured with authentication support.
     */
    authTokens: {
        [key: string]: string;
    };

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
 * Defines the default state scopes persisted by the `DefaultTurnStateManager`.
 * @template TConversationState Optional. Type of the conversation state object being persisted.
 * @template TUserState Optional. Type of the user state object being persisted.
 * @template TTempState Optional. Type of the temp state object being persisted.
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

/**
 * Default turn state manager implementation.
 * @template TConversationState Optional. Type of the conversation state object being persisted.
 * @template TUserState Optional. Type of the user state object being persisted.
 * @template TTempState Optional. Type of the temp state object being persisted.
 */
export class DefaultTurnStateManager<
    TConversationState extends DefaultConversationState = DefaultConversationState,
    TUserState extends DefaultUserState = DefaultUserState,
    TTempState extends DefaultTempState = DefaultTempState
> implements TurnStateManager<DefaultTurnState<TConversationState, TUserState, TTempState>>
{
    /**
     * Loads all of the state scopes for the current turn.
     * @param {Storage} storage - Storage provider to load state scopes from.
     * @param {TurnContext} context - Context for the current turn of conversation with the user.
     * @returns {Promise<DefaultTurnState<TConversationState, TUserState, TTempState>>} The loaded state scopes.
     */
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

    /**
     * Saves all of the state scopes for the current turn.
     * @param {Storage} storage - Storage provider to save state scopes to.
     * @param {TurnContext} context - Context for the current turn of conversation with the user.
     * @param {DefaultTurnState<TConversationState, TUserState, TTempState>} state - State scopes to save.
     */
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
