// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

export function createNpmPackageCard(result: any): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: `${result.name}`
            },
            {
                type: 'FactSet',
                facts: [
                    {
                        title: 'Scope',
                        value: `${result.scope}`
                    },
                    {
                        title: 'Version',
                        value: `${result.version}`
                    },
                    {
                        title: 'Description',
                        value: `${result.description}`
                    },
                    {
                        title: 'Keywords',
                        value: `${result.keywords.join(', ')}`
                    },
                    {
                        title: 'Date',
                        value: `${result.date}`
                    },
                    {
                        title: 'Author',
                        value: `${result.author.name}`
                    },
                    {
                        title: 'Publisher',
                        value: `${result.publisher.username}`
                    },
                    {
                        title: 'Maintainers',
                        value: `${result.maintainers.map((v: any) => v.email).join(', ')}`
                    }
                ]
            }
        ],
        actions: [
            {
                type: 'Action.OpenUrl',
                title: 'NPM',
                url: `${result.links.npm}`
            },
            {
                type: 'Action.OpenUrl',
                title: 'Homepage',
                url: `${result.links.homepage}`
            },
            {
                type: 'Action.OpenUrl',
                title: 'Repository',
                url: `${result.links.repository}`
            },
            {
                type: 'Action.OpenUrl',
                title: 'Bugs',
                url: `${result.links.bugs}`
            }
        ]
    });
}
