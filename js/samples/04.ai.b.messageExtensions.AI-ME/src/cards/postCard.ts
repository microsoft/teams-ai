// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 * Creates an adaptive card for a post.
 * @param {string} post The post to create the card for.
 * @returns {Attachment} The adaptive card attachment for the post.
 */
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
                text: 'by AI Assistant',
                size: 'Small',
                horizontalAlignment: 'Right',
                isSubtle: true
            }
        ]
    });
}
