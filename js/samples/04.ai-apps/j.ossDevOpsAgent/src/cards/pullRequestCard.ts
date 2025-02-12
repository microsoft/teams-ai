// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

export function createPullRequestCard(payload: any): Attachment {
    const pullRequest = payload.pull_request
    const assignee = pullRequest.assignee ? pullRequest.assignee.login : 'Unknown User';
    const prTitle = pullRequest.title;
    const prUrl = pullRequest.html_url;


    return CardFactory.adaptiveCard({
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card",
        version: "1.2",
        body: [
            {
                type: "TextBlock",
                text: `🔔 Assignee Update for Pull Request #${pullRequest.number} 🔔`,
                weight: "Bolder",
                size: "Medium",
                color: "Accent"
            },
            {
                type: "TextBlock",
                text: `**Title:** ${prTitle}`,
                wrap: true,
                size: "Medium",
                weight: "Bolder"
            },
            {
                type: "TextBlock",
                text: `${assignee} has been assigned to review this pull request.`,
                wrap: true,
                size: "Medium",
                spacing: "Medium"
            }
        ],
        actions: [
            {
                type: "Action.OpenUrl",
                title: "View on GitHub",
                url: prUrl
            }
        ],
    });
} 