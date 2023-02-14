// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

export function createPostCard(post: string): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
            {
                type: 'TextBlock',
                text: post,
                wrap: true
            },
            {
                type: 'TextBlock',
                text: 'by GPT',
                size: 'Small',
                horizontalAlignment: 'Right',
                isSubtle: true
            }
        ]
    });
}
