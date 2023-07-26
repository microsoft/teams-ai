// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from '@microsoft/teams-core';

/**
 *
 */
export function createInitialView(): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
            {
                type: 'Input.Text',
                id: 'prompt',
                placeholder: 'Enter a prompt for GPT',
                isMultiline: true,
                isRequired: true,
                errorMessage: 'A prompt is required'
            },
            {
                type: 'Container',
                minHeight: '200px',
                verticalContentAlignment: 'Center',
                items: [
                    {
                        type: 'Image',
                        url: 'data:image/png;base64,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',
                        horizontalAlignment: 'Center'
                    }
                ]
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'Generate',
                data: {
                    verb: 'generate'
                }
            }
        ]
    });
}
