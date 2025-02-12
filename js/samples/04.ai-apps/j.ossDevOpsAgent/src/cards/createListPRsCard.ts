// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

const listPRsCardTemplate: any = {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card",
    version: "1.3",
    body: [
        {
            type: "TextBlock",
            text: "📄 Pull Requests 📄",
            weight: "Bolder",
            size: "Medium",
            color: "Accent",
            wrap: true
        }
    ]
};

export function createListPRsCard(prs: any[]): Attachment {
    prs.forEach((pr: any) => {
        listPRsCardTemplate.body.push({
            type: "Container",
            spacing: "Medium",
            style: "emphasis",
            items: [
                {
                    type: "TextBlock",
                    text: `#${pr.number}: ${pr.title}`,
                    weight: "Bolder",
                    wrap: true,
                    size: "Medium"
                },
                {
                    type: "FactSet",
                    facts: [
                        { title: "Status:", value: `${pr.state === 'open' ? '🟢 Open' : '🔴 Closed'}` },
                        { title: "Author:", value: `${pr.user?.login || 'Unknown User'}` },
                        { title: "Created on:", value: `${new Date(pr.created_at).toLocaleDateString()}` }
                    ]
                },
                {
                    type: "TextBlock",
                    text: `Link: [View Pull Request](${pr.html_url})`,
                    wrap: true,
                    color: "Accent",
                    weight: "Bolder"
                }
            ]
        });
    });

    return CardFactory.adaptiveCard(listPRsCardTemplate);
} 