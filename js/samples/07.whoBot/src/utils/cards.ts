// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 *
 * @param displayName
 * @param givenName
 * @param surname
 * @param jobTitle
 * @param officeLocation
 * @param mail
 */
export function createUserPersonalInformationCard(
    displayName: string,
    givenName: string,
    surname: string,
    jobTitle: string,
    officeLocation: string,
    mail: string
) {
    return CardFactory.adaptiveCard({
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'large',
                weight: 'bolder',
                text: displayName
            },
            {
                type: 'FactSet',
                facts: [
                    {
                        title: 'Given name',
                        value: givenName
                    },
                    {
                        title: 'Surname',
                        value: surname
                    },
                    {
                        title: 'Job title',
                        value: jobTitle
                    },
                    {
                        title: 'Office location',
                        value: officeLocation
                    },
                    {
                        title: 'Email',
                        value: mail
                    }
                ]
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.0'
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

// TODO: /me/people, /me/messages, /me/drive/recent
