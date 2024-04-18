// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 * Creates an Adaptive Card with dynamic search control.
 * @returns {Attachment} Adaptive Card with dynamic search control.
 */
export function createDynamicSearchCard(): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.6',
        type: 'AdaptiveCard',
        body: [
            {
                text: 'Please search for npm packages using dynamic search control.',
                wrap: true,
                type: 'TextBlock'
            },
            {
                columns: [
                    {
                        items: [
                            {
                                'choices.data': {
                                    type: 'Data.Query',
                                    dataset: 'npmpackages'
                                },
                                id: 'dynamicSelect',
                                type: 'Input.ChoiceSet',
                                placeholder: 'Package name',
                                label: 'NPM package search',
                                isRequired: true,
                                errorMessage: 'There was an error',
                                isMultiSelect: true
                            }
                        ],
                        type: 'Column'
                    }
                ],
                type: 'ColumnSet'
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'DynamicSubmit',
                data: {
                    verb: 'DynamicSubmit'
                }
            }
        ]
    });
}
