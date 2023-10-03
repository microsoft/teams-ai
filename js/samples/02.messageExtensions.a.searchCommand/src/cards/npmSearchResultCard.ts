// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CardAction, CardFactory, MessagingExtensionAttachment } from 'botbuilder';

/**
 * Creates a messaging extension attachment for an npm search result.
 * @param {any} result The search result to create the attachment for.
 * @returns {MessagingExtensionAttachment} The messaging extension attachment for the search result.
 */
export function createNpmSearchResultCard(result: any): MessagingExtensionAttachment {
    // TODO: Use "Adaptive Card Hero Card" since Hero card is considered deprecated
    const card = CardFactory.heroCard(result.name, [], [], {
        text: result.description
    }) as MessagingExtensionAttachment;
    card.preview = CardFactory.heroCard(result.name, [], [], {
        tap: { type: 'invoke', value: result } as CardAction,
        text: result.description
    });
    return card;
}
