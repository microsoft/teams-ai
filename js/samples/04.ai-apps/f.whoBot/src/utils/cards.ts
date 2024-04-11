// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 *
 * @param {string} displayName The display name of the user
 * @param {string} givenName The given name of the user
 * @param {string} surname The surname of the user
 * @param {string} jobTitle The job title of the user
 * @param {string} officeLocation The office location of the user
 * @param {string} mail The email address of the user
 * @returns {Attachment} The adaptive card attachment for the user personal information.
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
 * Creates an adaptive card for the user's email.
 * @param {string} from The sender of the email
 * @param {string} subject The subject of the email
 * @param {string}sentDateTime The sent date time of the email
 * @param {string}bodyPreview The body preview of the email
 * @param {string}webLink The web link of the email
 * @returns {Attachment} The adaptive card attachment for the user email.
 */
export function createUserEmailCard(
    from: string,
    subject: string,
    sentDateTime: string,
    bodyPreview: string,
    webLink: string
) {
    return CardFactory.adaptiveCard({
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'Container',
                items: [
                    {
                        type: 'ColumnSet',
                        columns: [
                            {
                                type: 'Column',
                                width: 'stretch',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: `${from}`,
                                        size: 'Medium'
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: `${subject}`,
                                        spacing: 'None',
                                        size: 'Small'
                                    }
                                ]
                            },
                            {
                                type: 'Column',
                                width: 'auto',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: `${sentDateTime}`,
                                        spacing: 'None',
                                        size: 'Small'
                                    }
                                ],
                                verticalContentAlignment: 'Center'
                            }
                        ]
                    },
                    {
                        type: 'TextBlock',
                        text: `${bodyPreview}`,
                        isVisible: false,
                        size: 'Small',
                        isSubtle: true
                    },
                    {
                        type: 'ActionSet',
                        actions: [
                            {
                                type: 'Action.OpenUrl',
                                title: 'Open email',
                                url: `${webLink}`
                            }
                        ]
                    }
                ],
                separator: true
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
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

/**
 * Creates an adaptive card for the user's recent file.
 * @param {string} from - The sender of the email
 * @param {string} subject - The subject of the email
 * @param {string} startTime - The start time of the meeting
 * @param {string} endTime - The end time of the meeting
 * @param {string} meetingDescription - The description of the meeting
 * @param {string} joinUrl - The join url of the meeting
 * @returns {Attachment} The adaptive card attachment for the user calendar event.
 */
export function createCalendarEventCard(
    from: string,
    subject: string,
    startTime: string,
    endTime: string,
    meetingDescription: string,
    joinUrl: string
) {
    return CardFactory.adaptiveCard({
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
            {
                type: 'Container',
                items: [
                    {
                        type: 'ColumnSet',
                        columns: [
                            {
                                type: 'Column',
                                width: 'stretch',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: `${subject}`,
                                        size: 'Medium'
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: `${from}`,
                                        spacing: 'None',
                                        size: 'Small'
                                    }
                                ]
                            },
                            {
                                type: 'Column',
                                width: 'auto',
                                items: [
                                    {
                                        type: 'TextBlock',
                                        text: `Start Time: ${new Date(startTime).toLocaleDateString()}`,
                                        spacing: 'None',
                                        size: 'Small'
                                    },
                                    {
                                        type: 'TextBlock',
                                        text: `End Time: ${new Date(endTime).toLocaleDateString()}`,
                                        spacing: 'None',
                                        size: 'Small'
                                    }
                                ],
                                verticalContentAlignment: 'Center'
                            }
                        ]
                    },
                    {
                        type: 'TextBlock',
                        text: `${meetingDescription}`,
                        isVisible: false,
                        size: 'Small',
                        isSubtle: true
                    },
                    {
                        type: 'ActionSet',
                        actions: [
                            {
                                type: 'Action.OpenUrl',
                                title: 'Open email',
                                url: `${joinUrl}`
                            }
                        ]
                    }
                ],
                separator: true
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
    });
}
