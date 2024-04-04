// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 * Creates an adaptive card for editing a post.
 * @param {string} post - The post to be edited.
 * @param {boolean} previewMode - Whether the card is in preview mode.
 * @returns {Attachment} - The adaptive card attachment.
 */
export function createEditView(post: string, previewMode: boolean): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
            {
                type: 'Input.Text',
                id: 'prompt',
                placeholder: 'Enter a new prompt that updates the post below',
                isMultiline: true
            },
            {
                type: 'Container',
                minHeight: '160px',
                verticalContentAlignment: 'Center',
                items: [
                    {
                        type: 'TextBlock',
                        wrap: true,
                        text: post
                    },
                    {
                        type: 'Input.Text',
                        id: 'post',
                        isVisible: false,
                        value: post
                    }
                ]
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'Update',
                data: {
                    verb: 'update'
                }
            },
            {
                type: 'Action.Submit',
                title: previewMode ? 'Preview' : 'Post',
                data: {
                    verb: previewMode ? 'preview' : 'post'
                }
            }
        ]
    });
}
