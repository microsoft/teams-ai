// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 *
 */
export function createDynamicSearchCard(): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.2',
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
                        width: 'auto',
                        items: [
                            {
                                text: 'NPM packages search: ',
                                wrap: true,
                                height: 'stretch',
                                type: 'TextBlock'
                            }
                        ],
                        type: 'Column'
                    }
                ],
                type: 'ColumnSet'
            },
            {
                columns: [
                    {
                        width: 'stretch',
                        items: [
                            {
                                choices: [
                                    {
                                        title: 'Static Option 1',
                                        value: 'static_option_1'
                                    },
                                    {
                                        title: 'Static Option 2',
                                        value: 'static_option_2'
                                    },
                                    {
                                        title: 'Static Option 3',
                                        value: 'static_option_3'
                                    }
                                ],
                                isMultiSelect: false,
                                style: 'filtered',
                                'choices.data': {
                                    type: 'Data.Query',
                                    dataset: 'npmpackages'
                                },
                                id: 'choiceSelect',
                                type: 'Input.ChoiceSet'
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
                title: 'Submit',
                data: {
                    verb: 'DynamicSubmit'
                }
            }
        ]
    });
}
