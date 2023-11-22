// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory, CardAction, MessagingExtensionAttachment } from 'botbuilder';

/**
 * Creates an adaptive card for an npm package search result.
 * @param {any} result The search result to create the card for.
 * @returns {Attachment} The adaptive card attachment for the search result.
 */
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

/**
 * Creates a messaging extension attachment for an npm search result.
 * @param {any} result The search result to create the attachment for.
 * @returns {MessagingExtensionAttachment} The messaging extension attachment for the search result.
 */
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

/**
 * @returns {Attachment} The adaptive card attachment for the sign-in request.
 */
export function createSignOutCard(): Attachment {
    return CardFactory.adaptiveCard({
        version: '1.0.0',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: 'You have been signed out.'
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'Close',
                data: {
                    key: 'close'
                }
            }
        ]
    });
}

/**
 *
 * @param {string} displayName The display name of the user
 * @param {string} profilePhoto The profile photo of the user
 * @returns {Attachment} The adaptive card attachment for the user profile.
 */
export function createUserProfileCard(displayName: string, profilePhoto: string): Attachment {
    return CardFactory.adaptiveCard({
        version: '1.0.0',
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: 'Hello: ' + displayName
            },
            {
                type: 'Image',
                url: profilePhoto
            }
        ]
    });
}
