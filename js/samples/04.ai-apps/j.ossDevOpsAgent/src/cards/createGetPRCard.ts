// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

export function createGetPRCard(pr: any): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: `💻 ${pr.title} 💻`,
                wrap: true
            },
            {
                type: 'Container',
                spacing: 'Medium',
                style: 'emphasis',
                items: [
                    {
                        type: 'TextBlock',
                        text: `Author: ${pr.user?.login || 'Unknown User'}`,
                        weight: 'Bolder',
                        wrap: true
                    },
                    {
                        type: 'TextBlock',
                        text: `Status: ${pr.merged ? '🔴 Closed' : '🟢 Open' }`,
                        wrap: true,
                        color: pr.merged ? 'Attention' : 'Good'
                    },
                    {
                        type: 'TextBlock',
                        text: `Description: ${pr.body || 'No description specified.'}`,
                        wrap: true
                    }
                ]
            },
            {
                type: 'FactSet',
                facts: [
                    { title: 'Created At:', value: `${new Date(pr.created_at).toLocaleDateString()}` },
                    { title: 'Updated At:', value: `${new Date(pr.updated_at).toLocaleDateString()}` },
                    { title: 'Comments:', value: `${pr.comments}` }
                ]
            }
        ],
        actions: [
            {
                type: 'Action.OpenUrl',
                title: 'View on GitHub',
                url: `${pr.html_url}`
            }
        ]
    });
} 