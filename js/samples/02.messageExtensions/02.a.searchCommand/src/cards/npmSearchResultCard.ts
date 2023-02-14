// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CardAction, CardFactory, MessagingExtensionAttachment } from 'botbuilder';

export function createNpmSearchResultCard(result: any): MessagingExtensionAttachment {
    const card = CardFactory.heroCard(result.name, [], [], {
        text: result.description
    }) as MessagingExtensionAttachment;
    card.preview = CardFactory.heroCard(result.name, [], [], {
        tap: { type: 'invoke', value: result } as CardAction,
        text: result.description
    });
    return card;
}
