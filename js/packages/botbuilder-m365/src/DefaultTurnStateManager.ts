/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext, Storage, StoreItems } from "botbuilder-core";
import { TurnState, TurnStateEntry, TurnStateManager } from "./TurnState";

export interface DefaultTurnState<TCS extends {} = {}, TUS extends {} = {}, TTS extends {} = {}> extends TurnState {
    conversation: TurnStateEntry<TCS>;
    user: TurnStateEntry<TUS>;
    temp: TurnStateEntry<TTS>;
}

export class DefaultTurnStateManager<TCS extends {} = {}, TUS extends {} = {}, TTS extends {} = {}> implements TurnStateManager<DefaultTurnState<TCS,TUS,TTS>> {
    public async loadState(storage: Storage, context: TurnContext): Promise<DefaultTurnState<TCS,TUS,TTS>> {
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
        const state: DefaultTurnState<TCS,TUS,TTS> = {
            conversation: new TurnStateEntry(items[conversationKey], conversationKey),
            user: new TurnStateEntry(items[userKey], userKey),
            temp: new TurnStateEntry({} as TTS)
        };

        return state;
    }

    public async saveState(storage: Storage, context: TurnContext, state: DefaultTurnState<TCS,TUS,TTS>): Promise<void> {
       // Find changes and deletions
       let changes: StoreItems | undefined;
       let deletions: string[] | undefined;
       for (const key in state) {
           if (state.hasOwnProperty(key)) {
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